const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express()
const port = process.env.PORT || 5000;
require('dotenv').config()
const stripe = require("stripe")(process.env.STRIPE_SECRET)

//middleware
app.use(cors())
app.use(express.json())


//database connection
const uri = `mongodb+srv://${process.env.USER}:${process.env.PASSWORD}@cluster0.4w35qx6.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });



// function verifyJWT(req, res, next) {
//     const authHeader = req.headers.authorization;
//     console.log(authHeader);
//     if (!authHeader) {
//         return res.status(401).send({ message: 'unauthorized access' })
//     }

//     const token = authHeader;

//     jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
//         if (err) {
//             return res.status(403).send({ message: 'forbidden access' })
//         }
//         req.decoded = decoded;
//         next()
//     })
// }



async function run() {
    try {

        const categoryCollection = client.db('drift').collection('categories');
        const productsCollection = client.db('drift').collection('products');
        const userCollection = client.db('drift').collection('users');
        const myOrderCollection = client.db('drift').collection('myOrders');
        const paymentCollection = client.db('drift').collection('payments');
        const wishlistCollection = client.db('drift').collection('wishlist');

        //creating api for jwt
        // app.get('/jwt', async (req, res) => {
        //     const email = req.query.email;
        //     const query = { email: email }
        //     const user = await userCollection.findOne(query);
        //     if (user) {
        //         const token = jwt.sign({ email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '7d' })
        //         return res.send({ accessToken: token })
        //     }
        //     res.status(403).send({ accessToken: '' })
        // })


        //payment
        app.post('/create-payment-intent', async (req, res) => {
            const payment = req.body;
            const price = payment.price;
            const amount = price * 100;

            const paymentIntent = await stripe.paymentIntents.create({
                currency: 'usd',
                amount: amount,
                "payment_method_types": [
                    "card"
                ]
            });
            res.send({
                clientSecret: paymentIntent.client_secret
            });
        })

        //getting user data for my order
        app.post('/myOrders', async (req, res) => {
            const order = req.body;
            const result = await myOrderCollection.insertOne(order);
            res.send(result);
        })

        //getting wishlist data
        app.post('/wishlist', async (req, res) => {
            const wishlist = req.body;
            const result = await wishlistCollection.insertOne(wishlist);
            res.send(result);
        })

        //wishlist api
        app.get('/wishlist/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const cursor = wishlistCollection.find(query);
            const wish = await cursor.toArray();
            res.send(wish);
        })

        //getting add product Data
        app.post('/addProduct', async (req, res) => {
            const product = req.body;
            const result = await productsCollection.insertOne(product);
            res.send(result);
        })

        //creating api for my Product page
        app.get('/myProduct/:email', async (req, res) => {
            const email = req.params.email;
            const query = { seller_email: email };
            const cursor = productsCollection.find(query);
            const products = await cursor.toArray();
            res.send(products);
        })

        //creating api for my orders based on email
        app.get('/myOrders/:email', async (req, res) => {
            const email = req.params.email;
            // const decodedEmail = req.decoded.email;
            // if (email != decodedEmail) {
            //     return res.status(403).send({ message: 'forbidden access' });
            // }
            const query = { user_email: email };
            const cursor = myOrderCollection.find(query);
            const sellers = await cursor.toArray();
            res.send(sellers);
        })

        //creating api from my order using order id
        app.get('/myOrder/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const order = await myOrderCollection.findOne(query);
            res.send(order);
        })

        //getting user data
        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await userCollection.insertOne(user);
            res.send(result);
        })


        //delete user 
        app.delete('/users/:email', async (req, res) => {
            const email = req.params.email;
            const userQuery = { email: email };

            const result = await userCollection.deleteOne(userQuery);
            res.send(result)
        })

        //delete Product 
        app.delete('/myProducts/:id', async (req, res) => {
            const id = req.params.id;
            const userQuery = { _id: ObjectId(id) };
            const result = await productsCollection.deleteOne(userQuery);
            res.send(result)
        })


        //checking admin
        app.get('/users/admin/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email }
            const admin = await userCollection.findOne(query);
            res.send({ isAdmin: admin?.user_role === 'admin' });
        })

        //checking buyer
        app.get('/users/buyer/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email }
            const buyer = await userCollection.findOne(query);
            res.send({ isBuyer: buyer?.user_role === 'user' });
        })

        //checking seller
        app.get('/users/seller/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email }
            const seller = await userCollection.findOne(query);
            res.send({ isSeller: seller?.user_role === 'seller' });
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

        //creating api for single category
        app.get('/singleCategory/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const cursor = categoryCollection.find(query);
            const products = await cursor.toArray();
            res.send(products);
        })


        //creating api for single service
        app.get('/category/:id', async (req, res) => {
            const id = req.params.id;
            const query = { category_id: id };
            const cursor = productsCollection.find(query);
            const products = await cursor.toArray();
            res.send(products);
        })


        //store payment data and update myOrder and products payment info
        app.post('/payment', async (req, res) => {
            const payment = req.body;
            const result = await paymentCollection.insertOne(payment);
            const orderId = payment.orderId
            const orderFilter = { _id: ObjectId(orderId) }
            const updatedDoc = {
                $set: {
                    paid: true,
                    transactionId: payment.transactionId
                }
            }
            const orderResult = await myOrderCollection.updateOne(orderFilter, updatedDoc)
            res.send(result);
        })

        app.put('/products/:id', async (req, res) => {
            const id = req.params.id;
            const productQuery = { _id: ObjectId(id) }
            const option = { upsert: true };
            const updatedDoc = {
                $set: {
                    paid: true
                }
            }
            const productResult = await productsCollection.updateOne(productQuery, updatedDoc, option);
            // const wishResult = await wishlistCollection.updateOne(productQuery, updatedDoc, option);
            res.send(productResult);
        })


        //advertise data
        app.put('/advertise/:id', async (req, res) => {
            const id = req.params.id;
            console.log('id', id);
            const productQuery = { _id: ObjectId(id) }
            const option = { upsert: true };
            const updatedDoc = {
                $set: {
                    advertise: true
                }
            }
            const productResult = await productsCollection.updateOne(productQuery, updatedDoc, option);
            res.send(productResult);
        })


        //creating api for advertisement
        app.get('/advertise', async (req, res) => {
            const query = { advertise: true }
            const cursor = productsCollection.find(query);
            const advertise = await cursor.toArray();
            res.send(advertise);
        })

        //verify user
        app.patch('/allUser/seller/:email', async (req, res) => {
            // const decodedEmail = req.decoded.email;
            // const query = { email: decodedEmail }
            // const user = await userCollection.findOne(query)
            // if (user.user_role !== 'admin') {
            //     return res.status(403).send({ message: 'forbidden access' })
            // }
            const email = req.params.email;
            const filter = { email: email }
            const sellerFilter = { seller_email: email }
            const option = { upsert: true };

            const updatedDoc = {
                $set: {
                    verify: 'verified'
                }
            }
            const result = await userCollection.updateOne(filter, updatedDoc, option);
            const product = await productsCollection.updateMany(sellerFilter, updatedDoc, option);

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