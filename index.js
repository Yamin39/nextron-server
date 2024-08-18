const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion } = require("mongodb");
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

// uri
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.6fu63x8.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const productsCollection = client.db("nextronDB").collection("products");

    // get products
    app.get("/products", async (req, res) => {
      const search = req.query.search;
      const category = req.query.category;
      const minPrice = req.query.minPrice;
      const maxPrice = req.query.maxPrice;
      const sortText = req.query.sort;
      const page = parseInt(req.query.page);
      const size = parseInt(req.query.size);

      // queries
      const query = {};

      // query for search
      if (search) {
        query.name = {
          $regex: search,
          $options: "i",
        };
      }

      // query for category
      if (category) {
        query.category = category;
      }

      // query for price range
      if (minPrice && maxPrice) {
        query.price = {
          $gte: parseInt(minPrice),
          $lte: parseInt(maxPrice),
        };
      }

      // query for brands
      if (req.query.brands) {
        const brands = req.query.brands.split(",");
        query.brand = { $in: brands };
      }

      // sort
      const sort = {};

      if (sortText === "asc") {
        sort.price = 1;
      } else if (sortText === "desc") {
        sort.price = -1;
      } else if (sortText === "newest") {
        sort.time = -1;
      } else if (sortText === "oldest") {
        sort.time = 1;
      }

      const cursor = productsCollection
        .find(query, { sort })
        .skip(page * size)
        .limit(size);

      const result = await cursor.toArray();
      res.send(result);
    });

    // get products count
    app.get("/products/count", async (req, res) => {
      const search = req.query.search;
      const category = req.query.category;
      const minPrice = req.query.minPrice;
      const maxPrice = req.query.maxPrice;

      // queries
      const query = {};

      // query for search
      if (search) {
        query.name = {
          $regex: search,
          $options: "i",
        };
      }

      // query for category
      if (category) {
        query.category = category;
      }

      // query for price range
      if (minPrice && maxPrice) {
        query.price = {
          $gte: parseInt(minPrice),
          $lte: parseInt(maxPrice),
        };
      }

      // query for brands
      if (req.query.brands) {
        const brands = req.query.brands.split(",");
        query.brand = { $in: brands };
      }

      const products = await productsCollection.find(query).toArray();
      const count = products?.length;
      console.log("dfr", count);
      res.send({ count });
    });

    // get categories
    app.get("/categories", async (req, res) => {
      const products = await productsCollection.find().toArray();
      const result = [...new Set(products.map((product) => product.category))];
      res.send(result);
    });

    // get brands
    app.get("/brands", async (req, res) => {
      const products = await productsCollection.find().toArray();

      const result = [...new Set(products.map((product) => product.brand))];
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Nextron server is running");
});

app.listen(port, () => {
  console.log(`Nextron server is running on port: ${port}`);
});
