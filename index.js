const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express()
const port = process.env.PORT || 5000;
require('dotenv').config()


//middleware
app.use(cors())
app.use(express.json())


//database connection
const uri = `mongodb+srv://${process.env.USER}:${process.env.PASSWORD}@cluster0.4w35qx6.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });



function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    console.log(authHeader);
    if (!authHeader) {
        return res.status(401).send({ message: 'unauthorized access' })
    }

    const token = authHeader;

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
        if (err) {
            return res.status(401).send({ message: 'unauthorized access' })
        }
        req.decoded = decoded;
        next()
    })
}



async function run() {
    try {

        const categoryCollection = client.db('drift').collection('categories');
        const productsCollection = client.db('drift').collection('products');
        const userCollection = client.db('drift').collection('users');

        //getting user data
        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await userCollection.insertOne(user);
            res.send(result);
        })

        //creating api all user and seller for admin role
        app.get('/allUser/:user_role', async (req, res) => {
            const role = req.params.user_role;
            const query = { user_role: role };
            const cursor = userCollection.find(query);
            const sellers = await cursor.toArray();
            res.send(sellers);
        })

        //creating api for categories
        app.get('/categories', async (req, res) => {
            const query = {}
            const cursor = categoryCollection.find(query);
            const categories = await cursor.toArray();
            res.send(categories);
        })

        //creating api for single service
        app.get('/category/:id', async (req, res) => {
            const id = req.params.id;
            const query = { category_id: id };
            const cursor = productsCollection.find(query);
            const products = await cursor.toArray();
            res.send(products);
        })

        //verify user
        app.put('/allUser/seller/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) }
            const option = { upsert: true };
            const updatedDoc = {
                $set: {
                    verify: 'verified'
                }
            }
            const result = await userCollection.updateOne(filter, updatedDoc, option);
            res.send(result);
        })


        

    }
    finally {

    }
}

run().catch(err => console.log(err))



app.get('/', (req, res) => {
    res.send("Drift server is running")
})


//run server
app.listen(port, () => {
    console.log('server is running on port number', port);
})