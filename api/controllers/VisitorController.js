/**
 * VisitorController
 *
 * @description :: Server-side logic for managing visitors
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
const ical = require("ical-generator");
const util = require("util");
const async = require("async");
const validator = require("email-validator");
const nodemailer = require("nodemailer");
const recaptcha2 = require("recaptcha2");

module.exports = {
	anmelden: anmelden
};

function anmelden(req, res) {
    let body = req.swagger.params.name.value;

    sails.log.info("Incoming message from ip %s (%s)", req.ip, body);
    async.waterfall([
        function reCaptchaVerify(cb){
            let conf = sails.config.taktinale.recaptcha;
            if (conf.enabled) {
                let rec = new recaptcha2(
                    {siteKey: conf.siteKey, secretKey: conf.secretKey});
                let key = body["g-recaptcha-response"];
                rec.validate(key)
                    .then(() => cb(null))
                    .catch((err) => cb({message : err}));
            } else {
                cb(null);
            }
        },
        function validateEmail(cb) {
            cb(validator.validate(body.email)? null: 
                { code: 400, message: "Invalid Email supplied" });
        },
        function checkExists(cb){
            Visitor.find({email: body.email})
                .exec(cb);
        },
        function rejectIfEmailExists(records, cb){
            cb(records.length !== 0? 
                {code: 422, message: "Email Exists"} : null);
        },
        function create(cb){
            sails.log.info("Creating Visitor ORM Obj from body");
            Visitor.create({
                "name": body.name,
                "vorname": body.vorname,
                "email": body.email,
                "numguests": body.numguests,
                "numkids": body.numkids
            }).exec(cb);
        },
        sendConfirmationEmail,
        function respond(info, cb) {
            res.json({message: info});

            sails.log.info("Successfully registered. mail: %s", info);
            cb(null);
        }
    ], function asyncResultCallback(error) {
        if (error) {
            sails.log.warn("/anmelden failed with error %s, rejecting.", error)
            if (error.code) {
                res.send(error.code, error);
            } else {
                res.send(500, {message : error});
            }
        }
    });
}

function sendConfirmationEmail(forRecord, cb){
    let conf = sails.config.taktinale;
    let cal  = ical(conf.email.ical);
    
    conf.email.icalEvent["description"] = conf.email.textMessage(forRecord);
    cal.createEvent(conf.email.icalEvent);

    let transporter = nodemailer.createTransport(
        conf.nodeMailerTransport);

    if (conf.email.receipts) {
	for (let mail of conf.email.receipts) {
	    sails.log("Sending Receipt to %s", mail)
	    transporter.sendMail({
		from : conf.email.from,
		to : mail,
		envelope: {
		    "from" : conf.email.from,
		    "to" : util.format("%s, Receipt Receiver <%s>", mail, mail)
		},
		icalEvent: { content: cal.toString() },
		subject : util.format("Anmeldung von %s", forRecord.email),
		text: JSON.stringify(forRecord),
		html: util.format("<p><code>%s</code></p>", JSON.stringify(forRecord)),
	    }, function (info) {
		sails.log("Receipt Status: %s", info);
	    });
	}
    }

    transporter.sendMail({
        from : conf.email.from,
        to : forRecord.email,
        envelope: {
        "from" : conf.email.from,
        "to" : util.format("%s, %s %s <%s>", 
            forRecord.email, forRecord.vorname, 
            forRecord.name, forRecord.email)
        },
	icalEvent: { content: cal.toString() },
        subject : conf.email.subject,
	text: conf.email.textMessage(forRecord),
        html: conf.email.message(forRecord)
    }, cb);
}
