let http = require('http') //request 
let path = require('path')  ///path of responses
let bodyParser = require('body-parser')// parcours 
let sha1 = require('sha1') // hash password
let session = require('express-session');//saving 
let mongodb = require('mongodb') ///database
let MongoDB = require('connect-mongodb-session')(session); ///saving 
const express = require('express');
let pgclient = require('pg') /// middleware of posgresql 
const router = express.Router();
const mongoose = require('mongoose');
//const User = require('../models/user');
const jwt = require('jsonwebtoken') // taking token of authentification 
const { Console } = require('console')
const dbUri = "mongodb://127.0.0.1:27017/db"; //
        //collection:maSession3401
// mongoose.Promise = global.Promise;

// port and express instance 
const app = express ();
const PORT = 3401; 

mongoose.connect(dbUri, function(err){
    if(err){
        console.error('Error! ' + err)
    } else {
      console.log('Connected to mongodb')      
    }
});
/**app use */
	//define path to hold folders 
	app.use(express.static(path.join(__dirname, '/pathTofolder/app/views')))


	// view engine for template engine
	app.set(path.join(__dirname, '/path to folder'))
	//Body parser job 
	app.use(bodyParser.urlencoded({extended : false})) //changed to true whenver 

	//parse json objects for apllication 

	app.use(bodyParser.json())

	// server listenning 
	app.listen(PORT, function(){
		console.log(" Server running on port : ${PORT}")
	});
	//cors middleware to be enabled 
	app.use(cors());


// express session stored in mongodb 
app.use(session({
    secret: 'helloworld',
    saveUninitialized: false,
    resave: false,
    store : new MongoDB({
        uri: 'mongodb://127.0.0.1'+ ':' + '27017' + '/' + 'db',
        collection: 'maSession3401' , // store session per person 
    }),
    cookie : {maxAge : 3600 * 24 * 500},
}));
//  So so authentification 
app.post('/pathotologin', (res, req)=>{
	// postgresql 
	let pool = new pgclient.Pool(
		{
		user: 'uapv2101413',
			host: 'pedago01c.univ-avignon.fr',
				database: 'etd',
				password: 'dZxc8e',
					port:'5432'
		});
	
	let identifiant = req.body.identifiant;
	let password = res.body.password; 
	/// display id and pwd  calme down here only for console log
	console.log('pseudoname is  : '+ identifiant)
  	console.log('password is  : '+ password)
  	/*here real work check data in postgres data base (id + pwd )
	starting from request
	connwction login 
	look for username and password */
			pool.connect((err, pgclient, done) =>{
				if(err) {
					console.log('Error connecting to pg server' + err.stack);
				}
				else{
					console.log('Connected to pg server');
					//search to look for 
					sqlRequest ="SELECT  * FROM fredouil.users WHERE identifiant='"+request.body.pseudo+"' and motpasse ='"+sha1(request.body.password)+"'"
					//execution de la requete
					pgclient.query(sqlRequest, (err, data) =>
					{
						if(err){console.log('unknown error....')}
						else{
							let responseData = {};
								responseData.isConnected=false;
								if((data.rows[0] != null)&&(data.rows[0].identifiant==request.body.pseudo)&&(data.rows[0].motpasse==sha1(request.body.password)))
								{
									console.log('Authentification succeed... ')
									request.session.isConnected = true;
									console.log(request.session.id + "Session expired in " + request.session.cookie.maxAge + "seconds ;)")
									// stock session 
									var session = {};// save session details with user details 
									session.id = data.rows[0].id;
									session.firstName = data.rows[0].nom;
									session.lastName = data.rows[0].prenom;
									request.session.user = session;
									request.session.isConnected = true;
									console.log(responseData.isConnected);

									responseData ["id"]= data.rows[0].id;
									responseData ["nom"]= data.rows[0].nom;
									responseData ["prenom"]= data.rows[0].prenom;
									responseData ["identifiant"]= data.rows[0].identifiant;
									responseData ["date_naissance"] = data.rows[0].date_naissance;
									responseData ["humour"] = data.rows[0].humour;
									responseData ["avatar"] = data.rows[0].avatar;
									responseData ["statut_connexion"] = data.rows[0].statut_connexion;
									
									responseData.statusMsg='Connexion established ! Hey Whatssap mate ! '+data.rows[0].prenom;
									responseData.isConnected=true;
									responce.send(responseData); //sending data.....

								}
								else{
									console.log('Authentification failed... !')
									responseData.statusMsg='Connexion Failed check the input information please !';
									responce.send(responseData);
									let payload = {subject: responseData["id"]} // create jwt object  to contain the token 
									let token = jwt.sign(payload, 'secretKey')
									responce.send(token)
								}

							}
					})
				}

			});
	
});
// logout function 
app.post('/pathtologout', (request, response)=>{
	request.session.destroy(); //destroy th current session 
	console.log("End of the journey, session destroyed succefully ! ");
	response.send();// sending response to logout
}); 
//  to manage history 
app.post('/pathtohistory', (req, res)=>{
	
	let pool = new pgclient.Pool(
		{
		user: 'uapv2101413',
			host: 'pedago01c.univ-avignon.fr',
				database: 'etd',
				password: 'dZxc8e',
					port:'5432'
		 });
	const pgclient = await pool.connect();
	// adding a game into database (cleection history)
	try {
		await pgclient.query('INSERT INTO fredouil.historique '
			+'(id_users, date, nbreponse, temps, score)'
			+ 'VAlLUES('
			+ req.body.id_user + ','
			+ req.body.date_jeu+ ','
			+ req.body.niveau_jeu + ','
			+ req.body.nb_reponse_corr + ','
			+ req.body.temps + ','
			+ req.body.score + ');'
			
		);
		return res.status(201).send();
		
		
	} catch (errorLIMIT) {
		console.log("Can't update history ");
		console.log(errorLIMIT);
		return res.status(500).send();
	} finally {
		pgclient.release();
	}
		
	})

// to manage llast 10 games history 
app.get('/pathtohistory', (req,res)=>{
	const pgReq = 'SELECT * FROM fredouil.historique WHERE '+ req.query.id_db + 'ORBER BY  date_jeu LIMIT 10 DESC';
	var pool = new pgclient.Pool(
		{
		user: 'uapv2101413',
			host: 'pedago01c.univ-avignon.fr',
				database: 'etd',
				password: 'dZxc8e',
					port:'5432'
		});
	pool.connect((error, pgclient)=>{
		if (error) {
			console.log("Error connexion to database.....");
		} else {
			pgclient.query(pgReq, (error, result)=>{
				if (error) {
					console.log('error getting data')
					res.json();
				} else {
					console.log('Data load succefully ! ')
					res.json(result.rows);	
				}
			})
			
		}
	});
	pgclient.release();	
});

// route to get quizz  subjects
app.get('/pathtothemes', (req,res) =>{
	let mgdbClient = mongodb.mgdbClient;
	mongodb.connect(dbUri, (err, client) =>{
		if (err) {
			console.log('error loading themes');	
		}
		let db= client.db('db');
		db.collection('quiz').distinct('theme', (error, result)=>{
			if (error) {
				console.log('no theme found ')
			}
			res.json(result);
		});
	});
});

// bring 10 question per subject 
app.get('/pathtoquizz', (req,res) =>{

	mongodb.connect(dbUri, (err, client) =>{
			if (err) {
				console.log('error loading themes');	
			}
			let db= client.db('db');
			var pipeline = [
				{'$match': {'theme': req.body.theme}},{'$project': {'quiz': 1}},{'$unwind': '$quiz'},{'$$sample' : {'size': 10}}
			]
			db.collection(quiz).aggregate(pipeline).toArray((error, result)=>{
				if (error) {
					Console.log('Error while loading themes');
				}
				res.json(result);
			});
		});
	});


/*router.get('/players', (req,res) => {
	// define request to save history 
		let histodata = await pgclient.query(
			'SELECT * FROM fredouil.historique LEFT JOIN  fredouil.users ON fredouil.historique.id_users = fredouil.users.id ORDER BY score DESC 10'
		);
	
			

  res.json(events)
})*/

/*router.get('/static', verifyToken, (req, res) => {
  
  res.json(specialEvents)
})*/

/**/
