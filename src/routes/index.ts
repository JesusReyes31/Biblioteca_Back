import { Router } from "express"
import {readdirSync} from "fs";
const PATH_ROUTER = `${__dirname}`
const router = Router()

const cleanFileName = (fileName:String)=>{
    const file = fileName.split('.').shift();
    return file;
}
readdirSync(PATH_ROUTER).filter((fileName:String)=>{
    const cleanName = cleanFileName(fileName);
    if(cleanName !== "index"){
        import(`./${cleanName}`).then((moduleRouter)=>{
            router.use(`/${cleanName}`, moduleRouter.router);
        })
    }
})
export {router};