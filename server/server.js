require("dotenv").config();

const express = require("express");
const app = express();

app.use(express.json());

const stripe = require("stripe")(process.env.KashInfusions);

const storeItems = new Map([
  [1, {priceInCents: 10000, name: "Learn React today"}],
  [2, {priceInCents: 20000, name:"Learn CSS today"}],
]);

app.listen(3000);