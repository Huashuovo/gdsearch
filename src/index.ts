import { Session } from 'inspector/promises'
import { Context, Schema,h} from 'koishi'
import { writeFileSync,readFileSync } from 'fs';
import { CanvasRenderingContext2D, createCanvas,loadImage,registerFont } from 'canvas'
import fs from 'fs';
import path from 'path'
import { LevelObj, CreatorObj,SongObj,PageInfoObj, GdLevelData,LevelData, GdSongFileHub, TagData } from './interface';
import { error } from 'console';
import { TIMEOUT } from 'dns';

export const name = 'gddlquery'

export interface Config {}

export const Config: Schema<Config> = Schema.object({})
//
export const inject={
  required:['database'],
  optional:[],
}

declare module 'koishi' {
  interface Tables {
    GdData: {
      id:number;
      LastNumber:string;
    }
  }
}

registerFont(path.join(__dirname, 'resources','fonts', 'PUSAB__.otf'), { family: 'Pusab' });

const groupid=["onebot:661695432","onebot:976245666","onebot:1093710928","onebot:569801410","onebot:829768654","onebot:920929485","onebot:786304336",
  "onebot:468260393","onebot:978746194"
];

const groupid_newLevel=[...groupid,"onebot:864760069"];
const groupid_newDaily=[...groupid,"onebot:920313852","onebot:741225629"];
const groupid_newWeekly=[...groupid,"onebot:920313852","onebot:741225629"];
const groupid_newEvent=[...groupid,"onebot:920313852","onebot:741225629"];

const groupid_test=["onebot:661695432"];

//const ImaPath='D:/koishi/koishi-app/external/gddlquery/resources/'
//const ImaPath='C:/Users/Administrator/Desktop/koishi/koishi-app/external/gddlquery/resources/'
const ImaPath=__dirname+'/resources/';

//获取当前时间
function CurrentTime() {
    const now = new Date();
    return now.toLocaleString('zh-CN', { 
        timeZone: 'Asia/Shanghai',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });
}

//生成关卡卡片的大函数
async function CreateLevelCard(levelinfo:GdLevelData,DrawType:string):Promise<Buffer>{
  const canvas=createCanvas(1920,1080)
  const ctx=canvas.getContext('2d')
  //提前初始化一些数据
  let GddlInfo:any={}
  try{
    const response_gddl=await fetch(`https://gdladder.com/api/level/${levelinfo.Level.LevelId}`);
    GddlInfo=await response_gddl.json();
  }
  catch{
    GddlInfo={}
  }
  let IsGddl:boolean=false
  let LevelRating:string='null'
  let LevelEnjoyment:string='null'
  let LevelDownload:string='0'
  let LevelLikes:string='0'
  ctx.font="60px Pusab"
  ctx.fillStyle='#a4f1f1'
  ctx.strokeStyle='#000000'
  ctx.lineWidth=3
  const date = new Date();
  const isoDate = date.toLocaleString('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).replace(/\//g, '-');
  //判断是否有gddl数据
  if(typeof GddlInfo?.Rating=="number"){
    LevelRating=`${GddlInfo?.Rating.toFixed(0)}(${checktype(GddlInfo?.Rating)})`
  }
  if(typeof GddlInfo?.Enjoyment=="number"){
    LevelEnjoyment=`${GddlInfo?.Enjoyment.toFixed(0)}(${checktype(GddlInfo?.Enjoyment)})`
  }
  if(LevelEnjoyment!='null'||LevelRating!='null'){
    IsGddl=true
  }
  //判断应该使用什么模板
  switch(DrawType){
    case "SearchLevel":
      if(IsGddl==false){
        ctx.drawImage(await image('Template','level_search_notdemon.png'),0,0,1920,1080)
      }
      else{
        ctx.drawImage(await image('Template','level_search_demon.png'),0,0,1920,1080)
        text(LevelRating,ctx,1500,860)
        text(LevelEnjoyment,ctx,1500,990)
      }
      break;
    case "NewLevel":
      ctx.drawImage(await image('Template','new_rated.png'),0,0,1920,1080);
      break;
    case "NewDaily":
      if(IsGddl==false){
        ctx.drawImage(await image('Template','new_daily.png'),0,0,1920,1080)
      }
      else{
        ctx.drawImage(await image('Template','new_daily_demon.png'),0,0,1920,1080)
        text(LevelRating,ctx,1500,860)
        text(LevelEnjoyment,ctx,1500,990)
      }
      ctx.font="50px Pusab";
      ctx.fillStyle='#FFA0A2';
      text(isoDate,ctx,1590,185);
      ctx.fillStyle=`#a4f1f1`;
      ctx.font="60px Pusab";
      text(`#${levelinfo.PageInfo.Totol}`,ctx,1680,300);
      break;
      case "NewWeekly":
        if(IsGddl==false){
          ctx.drawImage(await image('Template','new_weekly.png'),0,0,1920,1080)
        }
        else{
          ctx.drawImage(await image('Template','new_weekly_gddl.png'),0,0,1920,1080)
          text(LevelRating,ctx,1500,860)
          text(LevelEnjoyment,ctx,1500,990)
        }
        text(`#${levelinfo.PageInfo.Totol}`,ctx,1680,180)
        break;
      case "NewEvent":
        if(IsGddl==false){
          ctx.drawImage(await image('Template','new_event_notdemon.png'),0,0,1920,1080)
        }
        else{
          ctx.drawImage(await image('Template','new_event_demon.png'),0,0,1920,1080)
          text(LevelRating,ctx,1500,860)
          text(LevelEnjoyment,ctx,1500,990)
        }
        text(`#${levelinfo.PageInfo.Totol}`,ctx,1680,180)
        break;
  }
  //填入数据
  TextSizeController(levelinfo.Level.LevelName,ctx,600,60,50,545,162)//关卡名
  text(levelinfo.Level.Stars,ctx,545,308)//星星数
  text(levelinfo.Level.LevelId,ctx,445,450)//关卡ID
  ctx.fillStyle='#ffffff'
  text(levelinfo.Creator.CreatorName,ctx,450,237)//作者名
  text(CheckLength(levelinfo)!,ctx,400,379)//关卡长度
  text(levelinfo.Level.Downloads.replace(/\B(?=(\d{3})+(?!\d))/g, ','),ctx,175,531)//下载数
  text(levelinfo.Level.Likes.replace(/\B(?=(\d{3})+(?!\d))/g, ','),ctx,710,531)//点赞数
  ctx.font="50px Pusab"
  text(levelinfo.Song.SongId!,ctx,415,920)//音乐ID
  ctx.fillStyle='#a4f1f1'
  text(levelinfo.Song.ArtistName,ctx,300,860)//音乐作者
  if(levelinfo.Song.SongId!="Null") ctx.fillStyle='#f982ff';
  else ctx.fillStyle='#27d2ff';
  TextSizeController(levelinfo.Song.SongName,ctx,1000,60,30,175,795)//音乐名
  ctx.fillStyle='#27d2ff';
  await SetDemonFace(ctx,levelinfo,DrawType)//放恶魔头
  await SetLikeImage(ctx,levelinfo)//放点赞图标
  await SetGameModeImage(ctx,levelinfo)//放游戏模式图标
  await SetCoinImage(ctx,levelinfo)//放硬币图标
  //await SetLevelTag(ctx,levelinfo)//放关卡tag

  return canvas.toBuffer('image/png')
}

//填入硬币
async function SetCoinImage(ctx:CanvasRenderingContext2D,levelinfo:GdLevelData){
  switch(levelinfo.Level.Coins){
    case "1":{
      ctx.drawImage(await image('Material','coin.png'),1120,510,60,60);
    }break;
    case "2":{
      ctx.drawImage(await image('Material','coin.png'),1095,510,60,60);
      ctx.drawImage(await image('Material','coin.png'),1145,510,60,60);
    }break;
    case "3":{
      ctx.drawImage(await image('Material','coin.png'),1070,510,60,60);
      ctx.drawImage(await image('Material','coin.png'),1120,510,60,60);
      ctx.drawImage(await image('Material','coin.png'),1170,510,60,60);
    }break;
  }
}

//填入关卡标签
async function SetLevelTag(ctx:CanvasRenderingContext2D,levelinfo:GdLevelData){
  await delay(500);
  const response_gddl_tag=await fetch(`https://gdladder.com/api/level/${levelinfo.Level.LevelId}/tags`);
  const GddlInfo_tag=await response_gddl_tag.json();
  ctx.font="50px Pusab";
  ctx.lineWidth=2;
  if(typeof GddlInfo_tag[0].Tag.Name!=`undefined`){
    let TagNumber:number=3;
    if(TagNumber>GddlInfo_tag.length) TagNumber=GddlInfo_tag.length;
    ctx.drawImage(await image('Material','tagbackground.png'),1410,310,500,400);
    for(let i=0;i<TagNumber;i++){
      ctx.drawImage(await image('Material',`${GddlInfo_tag[i].Tag.Name}.png`),1465,500+(i*60),66,65);
    }
    ctx.font="60px Pusab";
  }
}

//填入点赞图标
async function SetLikeImage(ctx:CanvasRenderingContext2D,levelinfo:GdLevelData){
  if(Number(levelinfo.Level.Likes)>=0){
    ctx.drawImage(await image('Material','like.png'),630,471,76,77)
  }
  else{
    ctx.drawImage(await image('Material','dislike.png'),620,441,74,116)
  }
}

//填入游戏模式图标(也就是星星和月亮)
async function SetGameModeImage(ctx:CanvasRenderingContext2D,levelinfo:GdLevelData){
  if(levelinfo.Level.Length=="5"){
    ctx.drawImage(await image('Material','moon.png'),490,265,50,50)
  }
  else{
    ctx.drawImage(await image('Material','star.png'),490,265,50,50)
  }
}

//填入恶魔头像
async function SetDemonFace(ctx:CanvasRenderingContext2D,levelinfo:GdLevelData,DrawType:string){
  if(DrawType=="NewLevel"&&levelinfo.Level.IsDemon=="1"&&levelinfo.Level.DemonDifficulty=="0"){
    await SetFaceFeatured(ctx,levelinfo,'Demon');
    return;
  }
  if(levelinfo.Level.IsDemon=="1"){
    switch(levelinfo.Level.DemonDifficulty){
      case "3":await SetFaceFeatured(ctx,levelinfo,'Ezd');break;
      case "4":await SetFaceFeatured(ctx,levelinfo,'Medd');break;
      case "0":await SetFaceFeatured(ctx,levelinfo,'Hdd');break;
      case "5":await SetFaceFeatured(ctx,levelinfo,'Insd');break;
      case "6":await SetFaceFeatured(ctx,levelinfo,'Exd');break;
    }}
  else if(levelinfo.Level.IsAuto=="1"){
    await SetFaceFeatured(ctx,levelinfo,'Auto');
    return;
  }
  else if(levelinfo.Level.Stars=="0"){
    ctx.drawImage(await image('DemonFace','NA.png'),1000,208,300,300)
  } 
  else if(levelinfo.Level.IsDemon!="1"){
    switch(levelinfo.Level.DifficultyNumerator){
      case "10":await SetFaceFeatured(ctx,levelinfo,'Easy');break;
      case "20":await SetFaceFeatured(ctx,levelinfo,'Normal');break;
      case "30":await SetFaceFeatured(ctx,levelinfo,'Hard');break;
      case "40":await SetFaceFeatured(ctx,levelinfo,'Harder');break;
      case "50":await SetFaceFeatured(ctx,levelinfo,'Insane');break;
    }
  }
}

//控制图片中的文字大小
async function TextSizeController(thistext:string,ctx:CanvasRenderingContext2D,maxWidth:number,initialFont:number,minFont:number,x:number,y:number){
  let fontSize=initialFont

  do{
    ctx.font=`${fontSize}px Pusab`;
    const textWidth=ctx.measureText(thistext).width;
    if(textWidth<=maxWidth){
      break;
    }
    fontSize-=5;
  }while(fontSize>=minFont);

  if(fontSize<50&&fontSize>=40){
    ctx.lineWidth=2;
  }
  else if(fontSize<40&&fontSize>=30){
    ctx.lineWidth=1;
  }
  text(thistext,ctx,x,y)
  ctx.font=`${initialFont}px Pusab`;
  ctx.lineWidth=3;
}

//判断关卡质量评级
async function SetFaceFeatured(ctx:CanvasRenderingContext2D,levelinfo:GdLevelData,Difficulty:string){
  if(levelinfo.Level.Stars=="0"){
    ctx.drawImage(await image('DemonFace',`${Difficulty}.png`),1000,208,300,300)
  }
  else if(levelinfo.Level.FeatureScore=="0"){
    ctx.drawImage(await image('DemonFace',`${Difficulty}.png`),1000,208,300,300)
  }
  else if(levelinfo.Level.FeatureScore!="0"){
    ctx.drawImage(await image('DemonFace',`${Difficulty}_Featured.png`),1000,208,300,300)
  }
  if(levelinfo.Level.Epic!="0"){
    switch(levelinfo.Level.Epic){
      case "1":ctx.drawImage(await image('DemonFace',`${Difficulty}_Epic.png`),1000,208,300,300);break;
      case "2":ctx.drawImage(await image('DemonFace',`${Difficulty}_Legendary.png`),1000,208,300,300);break;
      case "3":ctx.drawImage(await image('DemonFace',`${Difficulty}_Mythic.png`),1000,208,300,300);break;
    }
  }
}

//插入图片的简单函数
async function image(paths:string,picture_name:string){
  const imagePath=path.resolve(`${ImaPath}${paths}`,picture_name)
  const image=await loadImage(imagePath)
  return image
}

//插入文字的简单函数
function text(text:string,ctx:CanvasRenderingContext2D,x:number,y:number){
  ctx.fillText(text,x,y)
  ctx.strokeText(text,x,y)
}

//获取api的函数
async function postData(url: string, data: any) {//使用gd的api并得到数据，用的时候得多写data
  try {
      const response = await fetch(url, {
          method: 'POST', 
          headers: {
              'Content-Type': 'application/x-www-form-urlencoded', 
              'User-Agent':''
          },
          body: new URLSearchParams(data as any).toString() // 将数据编码为 URL 查询字符串
      });

      if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
      }

      let responseData:string = (await response.text()); // 获取响应文本
      
      return responseData;
  } catch (error) {
      console.log(`错误：${error.message}`);
  }
}

//显示GDDL关卡信息的函数(用于随机推关)
async function showvalue({session},LevelName: string): Promise<LevelData | null> {
  try {
    const response = await fetch(`https://gdladder.com/api/level/search?chunk=11&name=${encodeURIComponent(LevelName)}`);
    if (!response.ok) {
      throw new Error(`获取错误：${response.status}`);
    }
    const data = await response.json();
    if (data.total === 0 || data.levels.length === 0) {
      return null; 
    }
    let searchList:string='';

    if(data.levels.length===1) return data.levels[0];

    for(let i=0;i<data.levels.length;i++){
      searchList+=`${i+1}.${data.levels[i].Meta.Name}`;
      if(i===data.levels.length-1) await session.send(`${searchList}\n\n输入序号以查询详细信息`);
      searchList+=`\n`;
    }
    let num:number=await session.prompt();
    return data.levels[num-1]; 
  } catch (error) {
    console.error(error);
    return null;
  }
}

function checktype(value){
  if(typeof value===`number`){
    value=value.toFixed(2);
  }
  return value;
}

function checklength(value){
  if(value===6){
    return `platformer`;
  }
  else if(value===5){
    return `XL`;
  }
  else if(value===4){
    return `Long`;
  }
  else if(value===3){
    return `Medium`;
  }
  else if(value===2){
    return `Short`;
  }
  else if(value===1){
    return `Tiny`;
  }
  else{
    return `Error`;
  }
}

//让代码等待指定时长的函数
function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

//判断关卡歌曲(如果确定是官方曲目才会调用)
function CheckSong(Songnumber:string){
  let Songinfo:SongObj={SongName:"Null",ArtistName:"Null",SongId:"Null"}
  switch(Songnumber){
    case "0":Songinfo.SongName="Stereo Madeness";Songinfo.ArtistName="ForeverBound";break;
    case "1":Songinfo.SongName="Back On Track";Songinfo.ArtistName="DJVI";break;
    case "2":Songinfo.SongName="Polargiest";Songinfo.ArtistName="Step";break;
    case "3":Songinfo.SongName="Dry Out";Songinfo.ArtistName="DJVI";break;
    case "4":Songinfo.SongName="Base After Base";Songinfo.ArtistName="DJVI";break;
    case "5":Songinfo.SongName="Cant Let Go";Songinfo.ArtistName="DJVI";break;
    case "6":Songinfo.SongName="Jumper";Songinfo.ArtistName="Various Artists";break;
    case "7":Songinfo.SongName="Time Machine";Songinfo.ArtistName="Waterflame";break;
    case "8":Songinfo.SongName="Cycles";Songinfo.ArtistName="Cycles";break;
    case "9":Songinfo.SongName="xStep";Songinfo.ArtistName="DJVI";break;
    case "10":Songinfo.SongName="Clutterfunk";Songinfo.ArtistName="Waterflame";break;
    case "11":Songinfo.SongName="Theory Of Everything";Songinfo.ArtistName="dj-Nate";break;
    case "12":Songinfo.SongName="Electroman Adventures";Songinfo.ArtistName="Waterflame";break;
    case "13":Songinfo.SongName="Club Step";Songinfo.ArtistName="dj-Nate";break;
    case "14":Songinfo.SongName="Electrodynamix";Songinfo.ArtistName="dj-Nate";break;
    case "15":Songinfo.SongName="Hexagon Force";Songinfo.ArtistName="Waterflame";break;
    case "16":Songinfo.SongName="Blast Processing";Songinfo.ArtistName="Waterflame";break;
    case "17":Songinfo.SongName="Theory Of Everything 2";Songinfo.ArtistName="dj-Nate";break;
    case "18":Songinfo.SongName="Geometrical Dominator";Songinfo.ArtistName="Waterflame";break;
    case "19":Songinfo.SongName="Deadlocked";Songinfo.ArtistName="F-777";break;
    case "20":Songinfo.SongName="Fingerdash";Songinfo.ArtistName="MDK";break;
    case "21":Songinfo.SongName="Dash";Songinfo.ArtistName="ForeverBound";break;
  }
  return Songinfo
}

//处理从gd服务器获取的关卡信息的大函数(字符串数组->对象数组)
async function get_gdinfo(info:any){

  const result=info.split("#")

  const response_level:string[]=result[0].split(':').flatMap(part=>part.split("|"))

  let levelstr:string[][]=[]
  //
  for(let i=0,count=1,count_1=0;i<10;i++){
    levelstr[i]=response_level.slice(count_1*54,count_1*54+54)
    count++
    count_1++
  }
  
  const Level_obj:Array<LevelObj>=[]
  for(let i=0;i<levelstr.length;i++){
    if(typeof levelstr[i][1]=='undefined') break;
    Level_obj.push({LevelId:levelstr[i][1],LevelName:levelstr[i][3],GameVersion:levelstr[i][5],PlayerId:levelstr[i][7],DifficultyDenominator:levelstr[i][9],
      DifficultyNumerator:levelstr[i][11],Downloads:levelstr[i][13],OfficialSong:levelstr[i][15],LevelVersion:levelstr[i][17],Likes:levelstr[i][19],
      IsDemon:levelstr[i][21],DemonDifficulty:levelstr[i][23],IsAuto:levelstr[i][25],Stars:levelstr[i][27],FeatureScore:levelstr[i][29],Epic:levelstr[i][31],
      Objects:levelstr[i][33],Description:levelstr[i][35],Length:levelstr[i][37],CopiedId:levelstr[i][39],IsTwoPlayer:levelstr[i][41],Coins:levelstr[i][43],
      VerifiedCoins:levelstr[i][45],StarsRequested:levelstr[i][47],EditorTime:levelstr[i][49],CopiedEditorTime:levelstr[i][51],CustomSongId:levelstr[i][53]
    })
  }
  //
  //
  const response_creator:string[]=result[1].split(":")

  let creatorstr:string[]=response_creator

  for(let i=0,creator_id:string[]=[];i<response_creator.length;i++){
    if(response_creator[i].includes("|")){
      creator_id=response_creator[i].split("|")
      response_creator[i]=creator_id[1]
    }
  }

  const Creator_obj:Array<CreatorObj>=[]
  for(let i=0;i<creatorstr.length;i+=2){
    Creator_obj.push({CreatorId:creatorstr[i],CreatorName:creatorstr[i+1]})
  }
  //
  //
  const response_song:string[]=result[2].split("~:~")

  let songstr:string[][]=[]
  for(let i=0;i<response_song.length;i++){
    songstr[i]=response_song[i].split("~|~")
  }
  const Song_Obj:Array<SongObj>=[]
  for(let i=0;i<songstr.length;i++){
    Song_Obj.push({SongId:songstr[i][1],SongName:songstr[i][3],ArtistId:songstr[i][5],ArtistName:songstr[i][7],SongSize:songstr[i][9],
                  VideoId:songstr[i][11],SongLink:songstr[i][13],SongYoutubeUrl:songstr[i][15],IsVerified:songstr[i][17]
    })
  }
  //
  //
  const response_pageinfo:string[]=result[3].split(":")
  const PageInfo_Obj:PageInfoObj={Totol:response_pageinfo[0],Offset:response_pageinfo[1],Amount:response_pageinfo[2]}
  //
  //
  const Level_data:Array<GdLevelData>=[]
  let OneCreatorData:CreatorObj
  let OneSongData:SongObj

  for(let level_count=0,SongExist,CreatorExist;level_count<Level_obj.length;level_count++){
    SongExist=0
    CreatorExist=0
    for(let creator=0;creator<Creator_obj.length;creator++){
      if(Level_obj[level_count].PlayerId==Creator_obj[creator].CreatorId){
        OneCreatorData=Creator_obj[creator]
        CreatorExist=1
        break
      }
    }
    if(CreatorExist==0) OneCreatorData={CreatorId:Level_obj[level_count].PlayerId,CreatorName:"Unknown"}

    for(let song=0;song<Song_Obj.length;song++){
      if(Level_obj[level_count].CustomSongId==Song_Obj[song].SongId){
        OneSongData=Song_Obj[song]
        SongExist=1
        break
      }
    if(SongExist==0) OneSongData=CheckSong(Level_obj[level_count].OfficialSong)
    }

    Level_data.push({Level:Level_obj[level_count],Creator:OneCreatorData!,Song:OneSongData!,PageInfo:PageInfo_Obj})
  }
  //
  //
  return Level_data
}

//判断是什么难度
function CheckDifficulty(LevelData:GdLevelData){
  if(LevelData.Level.IsDemon=="1"){
    switch(LevelData.Level.DemonDifficulty){
      case "3":return `Easy Demon`;
      case "4":return `Medium Demon`;
      case "0":return `Hard Demon`;
      case "5":return `Insane Demon`;
      case "6":return `Extreme Demon`;
    }}
  else if(LevelData.Level.IsAuto=="1"){
    return `Auto`;
  }
  else if(LevelData.Level.Stars=="0"){
    return `Unrated`;
  }
  else if(LevelData.Level.IsDemon!="1"){
    switch(LevelData.Level.DifficultyNumerator){
      case "10":return `Easy`;
      case "20":return `Normal`;
      case "30":return `Hard`;
      case "40":return `Harder`;
      case "50":return `Insane`;
    }
  }
}

//同样判断是什么难度，但用于在搜索栏目中显示难度缩写
function SearchDifficultyDisplay(LevelData:GdLevelData){
  if(LevelData.Level.IsDemon=="1"){
    switch(LevelData.Level.DemonDifficulty){
      case "3":return `Ezd`;
      case "4":return `Med`;
      case "0":return `Hdd`;
      case "5":return `Insd`;
      case "6":return `Exd`;
    }}
  else if(LevelData.Level.IsAuto=="1"){
    return `Auto`;
  }
  else if(LevelData.Level.Stars=="0"){
    return `NA`;
  }
  else if(LevelData.Level.IsDemon!="1"){
    switch(LevelData.Level.DifficultyNumerator){
      case "10":return `Easy`;
      case "20":return `Normal`;
      case "30":return `Hard`;
      case "40":return `Harder`;
      case "50":return `Insane`;
    }
  }
}

//判断关卡是什么质量评级
function CheckFeature(LevelData:GdLevelData){
  let result:string=''
  if(LevelData.Level.Stars=="0"){
    result=`Unrated`
  }
  else if(LevelData.Level.FeatureScore=="0"){
    result=`Rated`;
  }
  else if(LevelData.Level.FeatureScore!="0"){
    result=`Featured`;
  }
  if(LevelData.Level.Epic!="0"){
    switch(LevelData.Level.Epic){
      case "1":result=`Epic`;break;
      case "2":result=`Legendary`;break;
      case "3":result=`Mythic`;break;
    }
  }
  return result
}

//通过songfilehub获取歌曲下载链接(很多时候得到的歌曲是错误的因此未使用)
async function GetSongURL(LevelID:string){
  const url='https://api.songfilehub.com/songs?levelID='+LevelID
  const response=await fetch(url)
  const Songinfo:GdSongFileHub=await response.json()
  const SongURL=Songinfo[0].downloadUrl
  return SongURL
}

//判断关卡长度
function CheckLength(LevelData:GdLevelData){
  switch(LevelData.Level.Length){
    case "0":return "Tiny";
    case "1":return "Short";
    case "2":return "Medium";
    case "3":return "Long";
    case "4":return "XL";
    case "5":return "Plat."
  }
}

//koishi的主函数
export function apply(ctx: Context) {
  
  ctx.model.extend('GdData',{id:"integer",LastNumber:"string"},{autoInc:true})

  //gddl查询命令代码(用于最开始的练手功能，不太有用只是保留)
  ctx.command('gddl查询 <LevelName:text> [page:number]',`从GDDL上查询关卡`)
    .action(async({session}, LevelName:string,page: number) => {
      const data:any=showvalue({session},LevelName)
      return data
        .then(data => {
          try{
          const levelName = data.Meta.Name;
          const rating = checktype(data.Rating);
          const enjoyment = checktype(data.Enjoyment);
          const creator = data.Meta.Creator;
          const songName=data.Meta.Song.Name;
          const songID=data.Meta.Song.ID;
          const songSize=data.Meta.Song.Size;
          const levelID=data.Meta.ID;
          const levelLength=checklength(data.Meta.Length);
          session?.send (`关卡名: ${levelName}\n关卡作者: ${creator}\n关卡ID:${levelID}\n关卡长度:${levelLength}\n难度评级: ${rating}\n玩家评价: ${enjoyment}\n音乐名:${songName}\n音乐ID:${songID}\n音乐大小:${songSize}\n`);
          }
          catch{return `搜索结果为空，检查关卡名是否输入错误？`}
      })
        .catch(error => {
          return `出现错误: ${error.message}`;
        });
    });

    //gd查询命令的代码
    ctx.command('gd查询 <str:text>','在gd服务器上进行关卡查询')
    .alias('gdsearch','与gd查询等效')
    .example('gd查询 bloodbath //与在游戏内打开rated only过滤器搜索bloodbath结果相同')
    .example('gd查询 --all -d 5 bloodbath //与在游戏内选择extreme demon并搜索bloodbath结果相同')
    .option('type','-t',{fallback:0})
    .option('diff','-u [value:number] 设定非demon的难度过滤，1为Easy，5为Insane')
    .option('demonFilter','-d [value:number] 设置demon的难度过滤，1为Easy Demon，5为Extreme Demon')
    .option('all','-a [value:boolean] 关闭rated only过滤器')
    .usage('注意！若填写了demon过滤器，非demon过滤器会被无视。可选项请写在搜索文本前面，否则可选项会被认为是搜索文本的一部分，以及默认只搜索rated关卡，若需要搜索unrated关卡请关闭rated only过滤器')
    .action(async({session,options},str)=>{
      if(typeof str=='undefined'){
        await session?.send('搜索参数为空，请重新尝试哦~');
        return;
      }
      if(!/^[A-Za-z0-9\s]+$/.test(str)){
        await session?.send('搜索参数只能为英文或数字哦~');
        return;
      }
      let PageNumber:number=0
      let data_star:number=1
      if(typeof options?.demonFilter!='undefined') options.diff=-2;
      if(options?.all) data_star=0;
      let data = {
        "str":str,
        "type": options?.type,
        "secret": "Wmfd2893gb7",
        "page": PageNumber,
        "diff":options?.diff,
        "demonFilter":options?.demonFilter,
        "star":data_star
        }
      while(1){
        data.page=PageNumber
        const response_gd:any=await postData("http://www.boomlings.com/database/getGJLevels21.php",data)
        if(response_gd==-1){
          await session?.send(h('quote',{id:session.messageId})+`搜索结果为空`)
          return
        }
        let Leveldata=await get_gdinfo(response_gd)
        let LevelList:string=""//关卡列表的数据
        let LevelNumber:string='0'//关卡列表的序号，默认值为1
        if(Leveldata.length>1){//判断是否只有一个关卡，只有一个就不进行下面的指定关卡了
          for(let i=0;i<Leveldata.length;i++){
            LevelList=LevelList+(i+1)+'. '+Leveldata[i].Level.LevelName+"("+SearchDifficultyDisplay(Leveldata[i])+")"+" by "+Leveldata[i].Creator.CreatorName+"\n"
          }
          let amout:string='10';
          if(Number(Leveldata[0].PageInfo.Totol)<=10){
            amout=Leveldata[0].PageInfo.Totol;
          }
          LevelList=LevelList+"\n("+amout+" of "+(Leveldata[0].PageInfo.Totol)+")"
          if(!options?.all){
            LevelList=LevelList+"\n当前搜索为仅限rated关卡，相关参数请输入gd查询 -h"
          }
          LevelList=LevelList+"\n输入序号以选中关卡,输入“结束”以中止搜索，输入“下一页”以翻页~"
          await session?.send(LevelList)
          while(1){
            LevelNumber=await session?.prompt(1000*30)!
            if(!LevelNumber){
              await session?.send(h('quote',{id:session.messageId})+'输入超时,请重新再试')
              return
            }
            else if(LevelNumber=="下一页"){
              PageNumber+=1;
              delay(1000)
              break;
            }
            else if(LevelNumber=="结束"){
              await session?.send(h('quote',{id:session.messageId})+"已中止");
              return;
            }
            else if(Number(LevelNumber)>=Leveldata.length+1||!/^\d+$/.test(LevelNumber)){
              LevelNumber=''
              continue
            }
            LevelNumber=String(Number(LevelNumber)-1);
            break
          }
          if(LevelNumber=="下一页"){
            continue;
          }
        }
        //console.log(Leveldata[0])
        const levelCardBuffer=await CreateLevelCard(Leveldata[LevelNumber],`SearchLevel`)
        const filepath=`${ImaPath}example.png`
        await writeFileSync(filepath,levelCardBuffer)
        await session?.send(h('img', { src: filepath }))
      break;
      }
    })

    //gd随机推关的命令，因为是从gddl获取的数据，因此使用的是gddl查询的函数(所以其实gddl查询也并非没有用处的样子)
    ctx.command('gd随机推关 <minRating:number> [maxRating:number]','从选定的Tier范围随机选出一个关卡')
    .option('minEnjoyment','-e <minEnjoyment:number> 设置最低enjoyment')
    .example('gd随机推关 17  //随机抽取一个tier17的关卡')
    .example('gd随机推关 17 20  //随机抽取一个tier17-20之间的关卡')
    .example('gd随机推关 17 20 -e 5  //随机抽取一个tier17-20之间，enjoyment大于等于5的关卡')
    .action(async({session,options},minRating,maxRating)=>{
      if(minRating<1||maxRating<1){
        await session?.send('输入的参数不合法，请重新输入！');
        return;
      }
      if(typeof maxRating=='undefined') maxRating=minRating
      if(minRating>maxRating){
        let temp=maxRating
        maxRating=minRating
        minRating=temp
      }
      let url=`https://gdladder.com/api/level/search?limit=1&page=0&sort=random&minRating=${minRating}&maxRating=${maxRating}`;
      if(typeof options?.minEnjoyment!='undefined') url+=`&minEnjoyment=${options.minEnjoyment}`;
      const LevelData=await fetch(url);
      const result:LevelData|any=await LevelData.json()
      const data=result.levels[0]
      const response_gddl_tag=await fetch(`https://gdladder.com/api/level/${data.ID}/tags`);
      const GddlInfo_tag=await response_gddl_tag.json();
      //console.log(data)
      const levelName = data.Meta.Name;
      const rating = checktype(data.Rating);
      const enjoyment = checktype(data.Enjoyment);
      const creator = data.Meta.Creator;
      const songName=data.Meta.Song.Name;
      const songID=data.Meta.Song.ID;
      const songSize=data.Meta.Song.Size;
      const levelID=data.Meta.ID;
      const levelLength=checklength(data.Meta.Length);
      let levelTag:string='';
      //await console.log(GddlInfo_tag);
      for(let i=0;i<GddlInfo_tag.length;i++){
        levelTag+=GddlInfo_tag[i].Tag.Name;
        if(i>=2||i==GddlInfo_tag.length-1) break;
        levelTag+=',';
      }
      if(levelTag=='') levelTag='null';
      let text:string=`关卡名: ${levelName}\n关卡作者: ${creator}\n关卡ID:${levelID}\n关卡长度:${levelLength}\n难度评级: ${rating}
玩家评价: ${enjoyment}\n音乐名:${songName}\n音乐ID:${songID}\n音乐大小:${songSize}
关卡标签:${levelTag}`;
      session?.send (text);
    }
  )

    //关卡播报的代码
    ctx.setInterval(async () => {
      const data = {
        "type": 11,
        "secret": "Wmfd2893gb7",
        "page": 0
      }
      const data_daily={
        "type": 21,
        "secret": "Wmfd2893gb7",
        "page": 0
      }
      const data_weekly={
        "type": 22,
        "secret": "Wmfd2893gb7",
        "page": 0
      }
      const data_event={
        "type": 23,
        "secret": "Wmfd2893gb7",
        "page": 0
      }
      //
      //需要发送的群聊,如果有群只想接收某一部分，则在播报中单独添加

      //检测gd服务器的rate情况并发送
      const response_gd:any=await postData("http://www.boomlings.com/database/getGJLevels21.php",data)
      let Leveldata:Array<GdLevelData>=[]
      try{
        Leveldata=await get_gdinfo(response_gd);
        const Current_Number=Leveldata[0].Level.LevelId;
        const Last_Number=await ctx.database.get('GdData',{id:1},['LastNumber'])
        let New_LevelData:Array<GdLevelData>=[]
        if(Current_Number!=Last_Number[0].LastNumber){
          await delay(10*1000);//检测到新关卡后等待10秒再进行第二轮查询，这是为了防止新关卡还没得到质量评级就被发送
          const response_gd_2:any=await postData("http://www.boomlings.com/database/getGJLevels21.php",data)
          if(typeof response_gd_2==='undefined') {
            console.log(CurrentTime()+"  !!!第二轮的rated api返回了undefined")
            return;
          }
          let Levledata_again=await get_gdinfo(response_gd_2)
          for(let i=0,n=0;i<Leveldata.length;i++){
            if(Levledata_again[i].Level.LevelId==Current_Number){
              n=i;
            }
            if(Leveldata[i].Level.LevelId==Last_Number[0].LastNumber){
              New_LevelData=Levledata_again.slice(n,i)
              break
            }
          }
          for(let i=0;i<New_LevelData.length;i++){
            console.log(CurrentTime()+'  *新关卡*:'+New_LevelData[i].Level.LevelName)//有新关卡的时候就在控制台也播报，用于debug
            const levelCardBuffer=await CreateLevelCard(Leveldata[i],`NewLevel`)
            const filepath=`${ImaPath}NewLevel_${i+1}.png`
            await writeFileSync(filepath,levelCardBuffer)
            //await ctx.broadcast(["onebot:661695432"],h('img', { src: filepath })) //发送到测试群聊
            await ctx.broadcast([...groupid,"onebot:864760069"],h('img', { src: filepath }))
            await ctx.database.set('GdData',{id:1},{LastNumber:Current_Number});
            await delay(1000);
          }
        }
      }
      catch{if(typeof response_gd==='undefined') console.log(CurrentTime()+"   !!!rated api返回了undefined")}
      //
      await delay(1000*5)
      //检测Daily
      const response_daily:any=await postData("http://www.boomlings.com/database/getGJLevels21.php",data_daily)
      let Leveldata_daily:Array<GdLevelData>=[]
      try{
        Leveldata_daily=await get_gdinfo(response_daily);
        const Current_Number_daily=Leveldata_daily[0].Level.LevelId;
        const Last_Number_daily=await ctx.database.get('GdData',{id:2},['LastNumber'])
        if(Current_Number_daily!=Last_Number_daily[0].LastNumber){
          await ctx.database.set('GdData',{id:2},{LastNumber:Current_Number_daily})
          let New_LevelData_daily=Leveldata_daily[0]
          console.log(CurrentTime()+'  *新daily*:'+New_LevelData_daily.Level.LevelName)
            // ctx.broadcast(["onebot:661695432","onebot:976245666"],"*新daily*\n关卡名:"+New_LevelData_daily.Level.LevelName
            //   +"\n关卡作者:"+New_LevelData_daily.Creator.CreatorName+"\n关卡长度:"+CheckLength(New_LevelData_daily)
            //   +"\n关卡难度:"+CheckDifficulty(New_LevelData_daily)+'('+New_LevelData_daily.Level.Stars+')'
            //   +"\n关卡质量:"+CheckFeature(New_LevelData_daily)
            // )
            const levelCardBuffer=await CreateLevelCard(New_LevelData_daily,`NewDaily`)
            const filepath=`${ImaPath}NewDaily.png`
            await writeFileSync(filepath,levelCardBuffer)
            await ctx.broadcast([...groupid_newDaily],h('img', { src: filepath }))
        }
      }
      catch{if(typeof response_daily==='undefined') console.log(CurrentTime()+"   !!!daily api返回了undefined")}
      //
      await delay(1000*5)
      //检测weekly
      const response_weekly:any=await postData("http://www.boomlings.com/database/getGJLevels21.php",data_weekly)
      let Leveldata_weekly:Array<GdLevelData>=[]
      try{
        Leveldata_weekly=await get_gdinfo(response_weekly);
        const Current_Number_weekly=Leveldata_weekly[0].Level.LevelId;
        const Last_Number_weekly=await ctx.database.get('GdData',{id:3},['LastNumber'])
        if(Current_Number_weekly!=Last_Number_weekly[0].LastNumber){
          await ctx.database.set('GdData',{id:3},{LastNumber:Current_Number_weekly})
          let New_LevelData_weekly=Leveldata_weekly[0]
          console.log(CurrentTime()+'  *新weekly*:'+New_LevelData_weekly.Level.LevelName)
            // ctx.broadcast(["onebot:661695432","onebot:976245666"],"*新weekly*\n关卡名:"+New_LevelData_weekly.Level.LevelName
            //   +"\n关卡作者:"+New_LevelData_weekly.Creator.CreatorName+"\n关卡长度:"+CheckLength(New_LevelData_weekly)
            //   +"\n关卡难度:"+CheckDifficulty(New_LevelData_weekly)+'('+New_LevelData_weekly.Level.Stars+')'
            //   +"\n关卡质量:"+CheckFeature(New_LevelData_weekly)
            // )
            const levelCardBuffer=await CreateLevelCard(New_LevelData_weekly,`NewWeekly`)
            const filepath=`${ImaPath}/NewWeekly.png`
            await writeFileSync(filepath,levelCardBuffer)
            await ctx.broadcast([...groupid_newWeekly],h('img', { src: filepath }))
        }
      }
      catch{if(typeof response_weekly==='undefined') console.log(CurrentTime()+"   !!!weekly api返回了undefined")}
      //
      await delay(1000*5)
      //检测event
      const response_event:any=await postData("http://www.boomlings.com/database/getGJLevels21.php",data_event)
      let Leveldata_event:Array<GdLevelData>=[]
      try{
        Leveldata_event=await get_gdinfo(response_event);
        const Current_Number_event=Leveldata_event[0].Level.LevelId;
        const Last_Number_event=await ctx.database.get('GdData',{id:4},['LastNumber'])
        if(Current_Number_event!=Last_Number_event[0].LastNumber){
          await ctx.database.set('GdData',{id:4},{LastNumber:Current_Number_event})
          let New_LevelData_event=Leveldata_event[0]
          console.log(CurrentTime()+'  *新event*:'+New_LevelData_event.Level.LevelName)
            // ctx.broadcast(["onebot:661695432","onebot:976245666"],"*新event*\n关卡名:"+New_LevelData_event.Level.LevelName
            //   +"\n关卡作者:"+New_LevelData_event.Creator.CreatorName+"\n关卡长度:"+CheckLength(New_LevelData_event)
            //   +"\n关卡难度:"+CheckDifficulty(New_LevelData_event)+'('+New_LevelData_event.Level.Stars+')'
            //   +"\n关卡质量:"+CheckFeature(New_LevelData_event)
            // )
            const levelCardBuffer=await CreateLevelCard(New_LevelData_event,`NewEvent`)
            const filepath=`${ImaPath}NewEvent.png`
            await writeFileSync(filepath,levelCardBuffer)
            await ctx.broadcast([...groupid_newEvent],h('img', { src: filepath }))
        }
      }
      catch{if(typeof response_event==='undefined') console.log(CurrentTime()+"   !!!event api返回了undefined")}
  }, 1000*60);

    
    ctx.command('测试 [str:text]')
      .action(async({session},str)=>{

      })

    
}
