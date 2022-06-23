const express = require('express');
const app = express();
const MongoClient = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectId;
require('dotenv').config();

const PORT = process.env.PORT || 3000;
const connectionString = process.env.CONNECTIONSTRING;

let message = [];

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
            db.collection('rappers').find().toArray()
                .then(data => {
                    response.render('index.ejs', { bars: data, message });
                })
                .catch(err => {
                    console.error(err);
                });
        });

        app.post('/addBar', (request, response) => {
            message = [];
            let bar = request.body;
            console.log(bar);
            verifySubmittedFields(bar);
            if (message.length > 0) return response.json({ message });
            let duplicate;
            db.collection('rappers').findOne({ barLyrics: request.body.barLyrics }) 
                .then(data => {
                    duplicate = data;
                    if (!duplicate) {
                        console.log('no duplicate found')
                        db.collection('rappers').insertOne({
                            barLyrics: bar.barLyrics,
                            barRapper: bar.barRapper,
                            barSong: bar.barSong,
                            barLikes: 1,
                            barDislikes: 0
                        })
                            .then(result => {
                                message = [];
                                response.json(result);
                            })
                            .catch(err => {
                                response.json(err);
                            });
                    } else {
                        console.log('duplicate found');
                        message.push(`This bar has already been submitted:\n
                        ${bar.barLyrics}`);
                        response.json({ duplicate, message });
                    }
                });
        });

        app.put('/editBar', (request, response) => {
            console.log(request.body);
            message = [];
            verifySubmittedFields(request.body);
            if (message.length > 0) return response.json({ message });
            const id = setGoodId(request.body);
            db.collection('rappers').findOneAndUpdate(
                { _id: id },
                {
                    $set: {
                        barLyrics: request.body.barLyrics,
                        barRapper: request.body.barRapper,
                        barSong: request.body.barSong
                    }
                },
                {
                    upsert: false
                }
                )
                .then(result => {
                    response.json({ success: 'success' });
                })
                .catch(err => {
                    message.push(err);
                    response.json({ error: err });
                });
        });

        app.put('/addVote', (request, response) => {
            message = [];
            const id = setGoodId(request.body);
            const bodyActions = request.body.sendAction;
            for (const action of Object.keys(bodyActions)) {
                if (bodyActions[action] === 'increment') request.body[action] += 1;
                if (bodyActions[action] === 'decrement') request.body[action] -= 1;
            }
            db.collection('rappers').findOneAndUpdate(
                { _id: id },
                {
                    $set: {
                        barLikes: request.body.barLikes,
                        barDislikes: request.body.barDislikes
                    }
                },
                {
                    upsert: false
                }
                )
                .then(result => {
                    console.log(result);
                    response.json({ success: true, id: request.body.barId, bodyActions });
                })
                .catch(err => {
                    message.push(error);
                    response.json({ success: false, error });
                });
        });

        app.delete('/delete/:id', (request, response) => {
            message = [];
            //user should pass their localStorage value for the entry
            //if user does not have authority to delete entry, respond appropriately
            //if user has authority to delete entry (localstorage value == 'created')
            console.log(request.params.id);
            const goodId = new ObjectId(request.params.id);
            db.collection('rappers').findOneAndDelete(
                { _id: goodId }
            )
                .then(result => {
                    console.log(result);
                    message.push(`deleted bar: ${request.body.barLyrics}`);
                    response.json(result.value);
                })
                .catch(err => {
                    response.json({ error: err });
                });
        });

        app.listen(PORT, () => {
            console.log(`listening on port ${PORT}`);
        });
    })
    .catch(err => console.error(err));

function verifySubmittedFields(obj) {
    for (const param in obj) {
        if (!obj[param]) {
            message.push(`${param.slice(3)} not filled in`);    
        }
    }
}

function setGoodId(obj) {
    const id = obj.barId;
    const goodId = new ObjectId(id);
    return goodId;
}