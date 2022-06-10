const express = require('express');
const app = express();
const MongoClient = require('mongodb').MongoClient;
require('dotenv').config();

const PORT = process.env.PORT || 3000;
const connectionString = process.env.CONNECTIONSTRING;

let message;

MongoClient.connect(connectionString, {
    useUnifiedTopology: true
})
    .then(client => {
        const db = client.db('rapper-api');

        app.set('view engine', 'ejs');
        app.use(express.static('public'));
        app.use(express.urlencoded({ extended: true }));
        app.use(express.json());

        app.get('/', (request, response) => {
            // console.log(request);
            db.collection('rappers').find().toArray()
                .then(data => {
                    response.render('index.ejs', { bars: data, message });
                })
                .catch(err => {
                    console.error(err);
                });
        });

        app.post('/addBar', (request, response) => {
            let bar = request.body;
            let duplicate;
            db.collection('rappers').findOne({ barLyrics: request.body.barLyrics }) 
                .then(data => {
                    duplicate = data;
                    if (!duplicate) {
                        db.collection('rappers').insertOne({
                            barLyrics: bar.barLyrics,
                            barRapper: bar.barRapper,
                            barSong: bar.barSong,
                            barLikes: 0,
                            barDislikes: 0
                        })
                            .then(result => {
                                message = '';
                                console.log('Bar added');
                                response.redirect('/');
                            })
                            .catch(err => {
                                console.error(err);
                            });
                    } else {
                        console.log('duplicate found');
                        message = `This bar has already been submitted: 
                        ${bar.barLyrics}`
                        response.redirect('/');
                    }
                });
        });

        app.put('/addVote', (request, response) => {
            message = '';
            db.collection('rappers').findOneAndUpdate(
                { barLyrics: request.body.barLyrics },
                {
                    $set: {
                        barLikes: request.body.barLikes,
                        barDislikes: request.body.barDislikes
                    }
                },
                {
                    upsert: true
                }
                )
                .then(result => {
                    response.json(result);
                })
                .catch(err => {
                    console.error(err);
                });
        });

        app.listen(PORT, () => {
            console.log(`listening on port ${PORT}`);
        });
    })
    .catch(err => console.error(err));
