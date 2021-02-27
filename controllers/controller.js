const schedule = require('node-schedule');
var zipcodes = require('zipcodes');
const puppeteer = require('puppeteer');
const path = require('path');
var nodemailer = require('nodemailer');
const alert = require('alert'); 
var CronJob = require('cron').CronJob;
const axios = require('axios');
const { table } = require('console');
const { min } = require('moment-timezone');


exports.runTest = async (req, res) => {
   // var testDist = getDist(61371);
    //console.log(testDist);
    
    console.log('Starting Test Soon');
    var jobName = req.params.email;

    
    const job = schedule.scheduleJob(jobName, '*/2 * * * *', async () => {
        console.log("Starting Job 🦺");
        var workingZips = [];
        const browser = await puppeteer.launch({
            headless: false,
            sloMo: 250
        });
        //const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.goto('https://www.walgreens.com/findcare/vaccination/covid-19/location-screening');
        var nearbyZips = zipcodes.radius(req.params.zip, req.params.radius);
        for(let i = 0; i < nearbyZips.length; i++){
            if(nearbyZips[i].length >= 5){
                console.log(nearbyZips[i]);
               // await page.evaluate( () => document.getElementById("inputLocation").value = "")
                //await page.type('input#inputLocation', nearbyZips[i]);
                await page.$eval('input#inputLocation', (el, value) => el.value = value, nearbyZips[i]);
                await page.click('button[data-reactid="16"]');
                let errorMsg = await page.$('span.input__error-text > strong');
                if(errorMsg != undefined){
                    await page.reload({ waitUntil: ["networkidle0", "domcontentloaded"] });
                    nearbyZips.push(nearbyZips[i]);
                    continue;
                }
             

                await page.waitForSelector('p.fs16', {  visible: true , timeout: 0 });
                let element = await page.$('p.fs16');
                let value = await page.evaluate(el => el.textContent, element); 
                console.log(value);
                if(value == "Appointments available!"){
                    console.log("FOUND!!!✔️");
                    workingZips.push(nearbyZips[i]);
                } 
            }
        }
        //Sorting Algorithm Below
        findMinZips(workingZips, req.params.email, req.params.zip);
        
        await page.close();
        await browser.close();
        await browser.disconnect; 
    })
    res.redirect('/');
}





async function findMinZips(workingZips, email, zip){
    if(workingZips.length > 0){
        var minValues = [];
        for(let k = 0; k < 20; k++){
            // console.log('Loop' + i)
            var minValue = Number.MAX_VALUE;
            var closestZip;
            var closestIndex = 0;
            for(let j = 0; j < workingZips.length; j++){
                var currentValDist = zipcodes.distance(parseInt(zip), parseInt(workingZips[j]));
                if(currentValDist < minValue){
                    minValue = currentValDist;  
                    closestZip = workingZips[j];
                    closestIndex = j;  
                }
            }
            minValues.push(closestZip);
            console.log(minValue);
            workingZips.splice(closestIndex, 1);
        }
        console.log(`Working Zips Array Length:    ${workingZips.length}`);
        await sendEmail(email, minValues, workingZips.length);   

    }
}


exports.endSearch =  async (req,res) => {  
        let currentJob = schedule.scheduledJobs[req.params.email];
        if(currentJob != null){
            await currentJob.cancel();

        }
        
        console.log(`[-] ${req.params.email}'s search was canceled`);
        res.redirect('/');
}



exports.realTime = async (req,res) => {
    let workingZips = [];
    (async () => { 
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.goto('https://www.walgreens.com/findcare/vaccination/covid-19/location-screening');
        var nearbyZips = zipcodes.radius(req.params.zip, req.params.radius);
        for(let i = 0; i < nearbyZips.length; i++){
            try{
                if(nearbyZips[i].length >= 5){
                    //console.log(nearbyZips[i]);
                    await page.$eval('input[name=text]', nearbyZips[i]);
                    const form = await page.$('.btn');
                    await form.evaluate( form => form.click());
                    await page.waitForSelector('p.fs16')
                    let element = await page.$('p.fs16')
                    let value = await page.evaluate(el => el.textContent, element)
                    console.log(value);
                    if(value != "Appointments unavailable"){
                        //console.log("FOUND!!! 😀 😃 😄")
                      //  console.log(`Go to ${nearbyZips[i]}`)
                        workingZips.push(nearbyZips[i]);
                    }
                }
            }catch(err){
                console.log(err);
            }
        }
        await browser.close();
        if(workingZips.length > 0){
            
            
            alert(`There Are ${workingZips.length} working Zipcodes Taking Apointments within ${req.params.radius} miles of ${req.params.zip}`);
            await res.render('realTime', {workingZips});
        }
        else{
          alert(`There Are No Walgreens Taking Apointments within ${req.params.radius} miles of ${req.params.zip}`);
          await res.render('realTime', {workingZips: 'none'});
        }
    
           
    })();

 



         
}
var testZips = ['3345', '88898','12345', '3345', '88898','12345', '3345', '88898','12345', '3345', '88898','12345', '3345', '88898','12345', '3345', '88898','12345', '3345', '88898','12345', '3345', '88898','12345', '3345', '88898', '88898','12345', '3345', '88898','12345', '3345', '88898','12345', '3345', '88898','12345', '3345', '88898','12345', '3345', '88898', '88898','12345', '3345', '88898','12345', '3345', '88898','12345', '3345', '88898','12345', '3345', '88898','12345', '3345', '88898', '88898','12345', '3345', '88898','12345', '3345', '88898','12345', '3345', '88898','12345', '3345', '88898','12345', '3345', '88898', '88898','12345', '3345', '88898','12345', '3345', '88898','12345', '3345', '88898','12345', '3345', '88898','12345', '3345', '88898']
exports.sendMail = (req,res) => {
    sendEmail('eli2finkel@gmail.com', testZips);
}


var apiKey = "JiTSowJGQ6ugvOglooK127JNOzOTzWhwpp8NtlkjLi9BEhd6JRKAKGMMmWVemWGg";
function getDist(zip, userZip){
    var dist = zipcodes.distance(parseInt(zip), parseInt(userZip));
    return dist;
}




  
async function sendEmail(email, zipcodes, arrayLength){
    // declare vars,
    var zipcodeString = ""
    for(var i = 0; i < zipcodes.length; i++){
        zipcodeString+=zipcodes[i] + ", \n";
    }
    let fromMail = 'vaccinehunteralert@gmail.com';
    let toMail = `${email}, eligfinkel@gmail.com` ;
    let subject = `Vaccines`;
    let text = `Yay!! we found a vaccines at ${zipcodeString}.  The array length was ${arrayLength}.  Please hurry as appointment fill up fast. Go to https://www.walgreens.com/findcare/vaccination/covid-19/location-screening`

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        //pool: true,
        auth: {
            user: fromMail,
            pass: 'vaccineHunter123'
        }
    });
    let mailOptions = {
        from: fromMail,
        to: toMail,
        subject: subject,
        text: text
    };
    // send email
   await  transporter.sendMail(mailOptions, (error, response) => {
        if (error) {
            console.log(error);
        }
           // console.log(response)
           console.log("Email Sent ✅")
        });
    transporter.close();
}
  
  
  
  
