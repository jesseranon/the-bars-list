const express = require('express');
const app = express();
const MongoClient = require('mongodb').MongoClient;
const dotenv = require('dotenv');
dotenv.config();

const PORT = process.env.PORT || 3000;
const connectionString = process.env.CONNECTIONSTRING;

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
                    response.render('index.ejs', { bars: data });
                })
                .catch(err => {
                    console.error(err);
                });
        });

        app.post('/addBar', (request, response) => {
            let bar = request.body;
            db.collection('rappers').insertOne({
                barLyrics: bar.barLyrics,
                barRapper: bar.barRapper,
                barSong: bar.barSong,
                barLikes: 0
            })
                .then(result => {
                    console.log('Bar added');
                    response.redirect('/');
                })
                .catch(err => {
                    console.error(err);
                });
        });

        app.put('/addLike', (request, response) => {
            db.collection('rappers').findOneAndUpdate(
                { barLyrics: request.body.barLyrics },
                {
                    $set: {
                        barLyrics: request.body.barLyrics,
                        barRapper: request.body.barRapper,
                        barLikes: request.body.barLikes
                    }
                },
                {
                    upsert: true
                }
                )
                .then(result => {
                    console.log(result);
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
