import { Component, Module } from '@nestjs/common';
import concat from 'ffmpeg-concat';
import { IWorkerCallback, IEngine } from '../common/worker.interface';
import { WorkerUtil } from '../common/worker.util';
import { UtilPage } from "./util";
const concat = require('ffmpeg-concat');
const path = require('path');
const fs=require('fs');

class UVCCameraParams {
    enableborder: boolean;
    enableturn: boolean;
    enablebgm: boolean;
    enablebefore:boolean;
    enableafter:boolean;
    enablegreen:boolean;
    concatOptions:string;
    border:string;;
    before_paste:string;
    after_paste:string;
    bgm:string;
    color:string;
    similarity:string;
    blend:string;
    ground_video:string;
    device_name:string;
    delay:string = '00:00:03';
}

@Component()
export class UVCCameraService implements IEngine {
        
    param: UVCCameraParams;
    cut_video(data: any, cb: IWorkerCallback, logger: any) {
        throw new Error("Method not implemented.");
    }

    constructor() {
        this.initParamFromTask();
    }

    mydevicename:string;
    async initParamFromTask() {
        let data = 'recog';
    switch(data){
        case 'photo':
        console.log('photo1')

            /**
             * 1.调用python脚本进行拍照
             */
            const Cmd = `python3 ././scripts/takephotos.py`;   
            console.info(`remote command = ${Cmd}`);   
            await WorkerUtil.remote_CMD(Cmd);

            /**
             * 2.进行剪切成10份
             *   目前原图是 5184像素 按照宽500像素 高1500像素 截出
             *   w h 参数代表剪切的大小
             *   x y 参数表示移动的位移变化
             */
            var myw = 500;
            var myh = 3000;
            var shiftX = 0;
            var shiftY = 0;
            var num = 0;
            for(var i=0;i<10;i++){
                num++;
                let cmd = `ffmpeg -i capt0000.jpg -vf crop=w=${myw}:h=${myh}:x=${shiftX}:y=${shiftY} ././working/cropimages/cap${num}.jpg`
                shiftX+=myw
                console.log("<<<<<<<<<<<<<<<<<<<<<<<<<<<<"+cmd);
                await WorkerUtil.executeCmd(cmd);
            }

            /**
             * 3.进行识别
             *   将python的返回值进行字符串拼接
             *   返回一个相对路径的图片地址
             */
            const Cmd2 = `python3 ././scripts/recognize.py`;   
            console.info(`remote command = ${Cmd2}`);   
            var recognRes = []; 
            await WorkerUtil.remote_CMD(Cmd2).then(
                (res) => {
                    var myres = res +'';
                    recognRes = myres.split(',');
            });
            recognRes.pop()
            console.log(recognRes);

            /**
             * 4.删除拍摄剪切前的原始图片
             *   如果剪切完的图片未删除则不会自动覆盖
             */
            let util = new UtilPage()
            await util.deleteImg('capt0000.jpg');

        break;
        case 'recog':
            /*
            * 5. 拍摄照片
            * -r后面跟着帧率
            */
            // console.log('myrecog')
            // let cmd1 = `ffmpeg -i /dev/video0 -r 1 -q:v 2 -f image2 /home/siiva/MOME/scripts/sava_img_files/image-%d.jpeg`
            // WorkerUtil.executeCmd(cmd1);

            /*
            * 调用并执行:
            * 检测照片是否存在人脸的python
            */
            // const cmd2 = `python3 ././scripts/yolo_for_img.py`;   
            const cmd2 = `python3 ././scripts/opencv_face.py`; 
            console.info(`remote command = ${cmd2}`);   
            await WorkerUtil.remote_CMD(cmd2);
            /*
            * 6. 拍摄视频
            */
            try {
                await setTimeout(function(){
                    console.log('myrecog')
                    let cmd3 = `ffmpeg -i /dev/video1 -ss 00:00:00 -t 00:00:05 /home/siiva/MOME/scripts/sava_img_files/out.mp4`
                    WorkerUtil.executeCmd(cmd3);
                },100)
                
            }catch(e){
                console.log("拍摄出错啦")
                console.log(e)
            } 
        break;
      }
    }

    async device() {

    }

    async takePhoto(cmd: any) {
        console.log('<<<<<<<<<<<<<<<<<<<takephotos.....'+cmd)
        WorkerUtil.executeCmd(cmd);
    }

    async recordStart(cmd: any) {
        console.log('<<<<<<<<<<<<<<<<<<<recording.....')
    }
    
    async recordStop(cmd: any) {
        console.log('end')
    }

}