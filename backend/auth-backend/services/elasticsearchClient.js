// /auth-backend/services/elasticsearchClient.js
import { Client } from "@elastic/elasticsearch";
import dotenv from "dotenv";
dotenv.config();

const elasticClient = new Client({
  node: process.env.ELASTIC_URL,   // e.g. https://localhost:9200
  auth: {
    username: process.env.ELASTIC_USERNAME,
    password: process.env.ELASTIC_PASSWORD
  },
  tls: {
    rejectUnauthorized: false
  }
});

export default elasticClient;



// import { Client } from "@elastic/elasticsearch";

// const esClient = new Client({
//     node: 'https://localhost:9200',   // ← localhost ES here
// });

// // module.exports = esClient;
// export default esClient;
