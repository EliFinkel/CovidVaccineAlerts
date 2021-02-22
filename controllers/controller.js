const schedule = require('node-schedule');
var zipcodes = require('zipcodes');
const puppeteer = require('puppeteer');
const path = require('path');
var nodemailer = require('nodemailer');


exports.runTest = async (req, res) => {
    console.log('Starting Test Soon');
    
    const job = schedule.scheduleJob('*/2 * * * *', async () => {
        console.log("😀");
        (async () => { 
            const browser = await puppeteer.launch();
            const page = await browser.newPage();
    
            await page.goto('https://www.walgreens.com/findcare/vaccination/covid-19/location-screening');
            var nearbyZips = zipcodes.radius(req.params.zip, req.params.radius);
            for(let i = 0; i < nearbyZips.length; i++){
                try{
                    if(nearbyZips[i].length < 5) break;
                    console.log(nearbyZips[i]);
                    await page.$eval('input[name=text]', nearbyZips[i]);
            

                    const form = await page.$('.btn');
                    await form.evaluate( form => form.click() );
            
                    await page.waitForSelector('p.fs16')
                    let element = await page.$('p.fs16')
                    let value = await page.evaluate(el => el.textContent, element)
                    console.log(value);
                    if(value != "Appointments unavailable"){
                        console.log("FOUND!!! 😀 😃 😄 😀 😃 😄 😀 😃 😄 😀 😃 😄")
                        console.log(`Go to ${nearbyZips[i]}`)
                        sendEmail(req.params.number, nearbyZips[i]);
                                                                                           
                        
                  }
                }catch(err){
                    console.log(err);
                }
               
            }
            
    
            await browser.close();
        })();
    })
   


}



exports.sendMail = (req,res) => {
    sendEmail('eligfinkel@gmail.com', "60035");
}







async function sendMessage (email, zipcode){
    const accountSid = 'AC33ade5747efbc0b824ba739524e1737a';
    const authToken = 'c239672920d3253c0b906f98798f24e4';
    const client = require('twilio')(accountSid, authToken);
    
    client.messages
      .create({
         body: `Yay!! We found a vaccine at ${zipcode}.  Act fast and signup at walgreens`,
         from: '+16308127527',
         to: `+1${email}`
       })
      .then(message => console.log(message.sid));
   
  }
      




  
function sendEmail(email, zipcode){
    // declare vars,
    let fromMail = 'eligfinkel@gmail.com';
    let toMail = email;
    let subject = `Vaccine found at ${zipcode}`;
    let text = `Yay!! we found a vaccine at ${zipcode}.  Please hurry as appointment fill up fast. Go to https://www.walgreens.com/findcare/vaccination/covid-19/location-screening`

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: fromMail,
            pass: 'garrison168211'
        }
    });
    let mailOptions = {
        from: fromMail,
        to: toMail,
        subject: subject,
        text: text
    };
    // send email
    transporter.sendMail(mailOptions, (error, response) => {
        if (error) {
            console.log(error);
        }
            console.log(response)
        });
}
  
  
  
  