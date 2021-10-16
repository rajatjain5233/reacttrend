import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { StyleSheet, Text, View,FlatList,
  ActivityIndicator,
  Image } from 'react-native';
import {useState,useEffect} from "react";
// var Stock = require("stock-technical-indicators");

// const Indicator = Stock.Indicator
// const { Supertrend } = require("stock-technical-indicators/study/Supertrend")
// const newStudyATR = new Indicator(new Supertrend());
// const { Indicator } = require('../../study/index');

// const { Supertrend } = require('../../study/Supertrend');
// const newStudySuperTrend = new Indicator(new Supertrend());
// const calculateSupertrend = newStudySuperTrend.calculate(ATR_DATA, { period: 7, multiplier: 3 });
// console.log(calculateSupertrend);
var ATR = require('technicalindicators').ATR
var MFI = require('technicalindicators').MFI
var TI = require('technicalindicators');
const SMA = require('technicalindicators').SMA;
import { Series, DataFrame } from 'pandas-js';
import { Audio } from 'expo-av';
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';



const BACKGROUND_FETCH_TASK = 'background-fetch';



TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
  const now = Date.now();

  console.log(`Got background fetch call at date: ${new Date(now).toISOString()}`);

  // Be sure to return the successful result type!
  return BackgroundFetch.Result.NewData;
});


export default function App() {
  const [seconds, setSeconds] = useState(1);
  const [sound, setSound] = React.useState();

  async function playSound() {
    console.log('Loading Sound');
    const { sound } = await Audio.Sound.createAsync(
       require('./assets/bodyguard-cell-phone-576.mp3')
    );
    setSound(sound);

    console.log('Playing Sound');
    await sound.playAsync();
  }
  

  useEffect(async() => {
    // const timer = setInterval(() => {
    //   console.log("seconds ",seconds);
      
    //       // break;
      
    // }, 10000);
    //            // clearing interval
    // return () => clearInterval(timer);
    fetch('https://api1.binance.com/api/v3/klines?symbol=BTCUSDT&limit=100&interval=15m',   {method: "GET"})
          .then((response) => response.json())
          .then((responseData) =>
          {   
              let responseDataFormatted=[];
              let open=[],high=[],low=[],close=[],volume=[];
              var input={};
              var period=14;
              var supertrend_period=10;
              let dataframe_data=[];

              for(let i=0;i<responseData.length;i++){
                let individual_quote=responseData[i];
                var s = new Date(individual_quote[0]).toISOString();
                let individualQuoteFormated=[];
                individualQuoteFormated.push(s);
                individualQuoteFormated.push(individual_quote[1]);
                individualQuoteFormated.push(individual_quote[2]);
                individualQuoteFormated.push(individual_quote[3]);
                individualQuoteFormated.push(individual_quote[4]);
                ////LOW pushed
                let low_new=parseFloat(individual_quote[3]);
                low_new=low_new.toFixed(3);
                open.push(parseFloat(individual_quote[1]));
                high.push(parseFloat(individual_quote[2]));
                low.push(parseFloat(individual_quote[3]));
                close.push(parseFloat(individual_quote[4]));
                volume.push(parseFloat(individual_quote[5]));
                let data_individual={};
                data_individual.open=individual_quote[1];
                data_individual.high=individual_quote[2];
                data_individual.low=individual_quote[3];
                data_individual.close=individual_quote[4];
                data_individual.volume=individual_quote[5];
                dataframe_data.push(data_individual);
              }
             
              input.high=high;
              input.low=low;
              input.close=close;
              // input.volume=volume;
              input.period=period;
              let atr_len=high.length;
              //###########################################
              var TR=new Array(atr_len).fill(0);
              var HL=new Array(atr_len).fill(0);
              var HYC=new Array(atr_len).fill(0);
              var LYC=new Array(atr_len).fill(0);
              for(let i=0;i<close.length;i++){
                HL[i]=high[i]-low[i];
                let hyc=Math.abs(high[i]-close[i-1]);
                let lyc=Math.abs(low[i]-close[i-1]);
                if(isNaN(hyc)){
                  hyc=0;
                }
                if(isNaN(lyc)){
                  lyc=0;
                }
                HYC[i]=hyc;
                LYC[i]=lyc;
                TR[i]=parseFloat(Math.max(HL[i],HYC[i],LYC[i]).toFixed(2));
              }
              //###########################################
              let con=new Array(atr_len).fill(0);
              let sum=0;
              for(var i=0;i<supertrend_period;i++){
                // con[i]=0;
                sum=TR[i]+sum;
              }
              sum=sum/supertrend_period;
              con[supertrend_period-1]=sum;
              for(let i=supertrend_period;i<con.length;i++){
                // con[i]=0;
                con[i]=TR[i];
              }
              console.log(con)
              //###########################################
              let ATR_period=new Array(atr_len).fill(0);
              ATR_period[supertrend_period-1]=con[supertrend_period-1];
              let alpha=0.1;
              for (let exec = supertrend_period;  exec < con.length;  exec++) {
                console.log( exec);
                var newPoint = (ATR_period[exec-1] *(1-alpha))+(con[exec] *alpha);
                ATR_period[exec]=parseFloat(newPoint.toFixed(6));
              }
              console.log(ATR_period)

              //###########################################

              let multiplier=3;//multiplier for supertrend


              let basic_Upper_band=[];
              let basic_Lower_band=[];
              let final_basic_Upper_band=new Array(atr_len).fill(0);
              let final_basic_Lower_band=new Array(atr_len).fill(0);
              for(var i=0;i<ATR_period.length;i++){
                //  console.log("ATR_period",i,ATR_period.length);
                 basic_Upper_band[i]=((high[i]+low[i])/2)+(multiplier*ATR_period[i]);
                 basic_Lower_band[i]=((high[i]+low[i])/2)-(multiplier*ATR_period[i]);
              }
              let supertrend=new Array(atr_len).fill(0);
              for(var i=supertrend_period;i<ATR_period.length;i++){
                if(basic_Upper_band[i]<final_basic_Upper_band[i-1]||
                  close[i-1]>final_basic_Upper_band[i-1]
                  ){
                  final_basic_Upper_band[i]=basic_Upper_band[i];
                }
                else{
                  final_basic_Upper_band[i]=final_basic_Upper_band[i-1];
                }
              }
              // IF C.BLB > P.FLB OR P.CLOSE < P.FLB: C.FLB = C.BLB
              // IF THE CONDITION IS NOT SATISFIED: C.FLB = P.FLB
            
              for(var i=supertrend_period;i<ATR_period.length;i++){
                if(basic_Lower_band[i]>final_basic_Lower_band[i-1]||
                  close[i-1]<final_basic_Lower_band[i-1]){
                  final_basic_Lower_band[i]=basic_Lower_band[i];
                }
                else{
                  final_basic_Lower_band[i]=final_basic_Lower_band[i-1];
                }
              }
              // console.log("final_basic_Upper_band",final_basic_Upper_band);
              // console.log("final_basic_Lower_band",final_basic_Lower_band);
              
              for(var i=supertrend_period;i<ATR_period.length;i++){
                if(supertrend[i-1]==final_basic_Upper_band[i-1]&&close[i]<=final_basic_Upper_band[i]){
                  supertrend[i]=final_basic_Upper_band[i];
                }
                else if(supertrend[i-1]==final_basic_Upper_band[i-1]&&close[i]>final_basic_Upper_band[i]){
                  supertrend[i]=final_basic_Lower_band[i];
                }
                else if(supertrend[i-1]==final_basic_Lower_band[i-1]&&close[i]>=final_basic_Lower_band[i]){
                  supertrend[i]=final_basic_Lower_band[i];
                }
                else if(supertrend[i-1]==final_basic_Lower_band[i-1]&&close[i]<final_basic_Lower_band[i]){
                  supertrend[i]=final_basic_Upper_band[i];
                }
                else 
                  supertrend[i]=0;  
              }
              let stx=new Array(atr_len).fill("");
              for(var i=0;i<supertrend.length;i++){
                if(supertrend[i] > 0.00){
                      if(close[i]<supertrend[i]){
                        stx[i]="down";
                      }else{
                        stx[i]="up"; 
                      }
                }else{
                  stx[i]="NAN";
                }
              }
              if(stx[atr_len-1]!=stx[atr_len-2]){
                playSound();
                return sound
                ? () => {
                    console.log('Unloading Sound');
                    sound.unloadAsync(); }
                : undefined;
              }
                        
          })
          .catch((error) => {
              console.error(error);
          });
  });

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Favorite Pairs</Text>
      <Text>Number of seconds is {seconds}</Text>
  
  </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
    alignItems: 'center'
  },
  text: {
    fontSize: 20,
    color: '#101010',
    marginTop: 60,
    fontWeight: '700'
  },
  listItem: {
    marginTop: 10,
    paddingVertical: 20,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    flexDirection: 'row'
  },
  coverImage: {
    width: 100,
    height: 100,
    borderRadius: 8
  },
  metaInfo: {
    marginLeft: 10
  },
  title: {
    fontSize: 18,
    width: 200,
    padding: 10
  }
});
