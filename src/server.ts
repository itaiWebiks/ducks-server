import { Pool } from 'pg';
import { log } from "console";
import { Socket } from "socket.io";

const express=require("express");
const app=express();
const http=require("http");
const cors =require("cors");
const {Server}=require("socket.io");
app.use(cors())

const localpool = new Pool({ //if you have local PG 
  user: 'postgres',    
  host: 'localhost',      
  database: 'test2',    
  password: 'itaisql420',
  port: 5432,     
});


const ConstainerPool = new Pool({ //container PG
  user: 'postgres',        
  host: 'localhost',        // Connect to the local host where the container is exposed
  database: 'postgres',       
  password: 'mysecretpassword', 
  port: 3002,               // Use the exposed port of the PostgreSQL container
});

const server= http.createServer(app);
const io=new Server(server,{
  cors:{
    origin:"http://localhost:5173",
    methods:["GET","POST"]
  }
})

io.on("connection",(socket:Socket)=>{
  console.log("conected");

  socket.on('getDucks', async () => {
    try {
      console.log("wantducks");
      const { rows:duckRows } = await ConstainerPool.query('SELECT * FROM ducks');
      // const { rows:rabbitRows } = await pool.query('SELECT * FROM rabbits');
      socket.emit('ducks', duckRows);
    } catch (error) {
      console.error(error);
    }
  });
  
  socket.on('getRabbits', async () => {
    try {
      console.log("wantrabbits");
      // const { rows:duckRows } = await pool.query('SELECT * FROM ducks');
      const { rows:rabbitRows } = await ConstainerPool.query('SELECT * FROM rabbits');
      socket.emit('rabbits', rabbitRows);
    } catch (error) {
      console.error(error);
    }
  });

  socket.on('addToTable', async ({ obj, tableName }) => {
    try {
      const columns = Object.keys(obj).join(', ');
      const values = Object.values(obj);
      const placeholders = values.map((_, index) => `$${index + 1}`).join(', ');
      const query = `INSERT INTO ${tableName} (${columns}) VALUES (${placeholders}) RETURNING *`;
      const result = await ConstainerPool.query(query, values);
  
      socket.emit('addSuccess', result.rows[0]);
    } catch (error) {
      console.error('Error inserting data:', error);
      socket.emit('addError', 'Error adding data to the table.');
    }
  });
  

})

server.listen(3001,()=>{
  console.log("server is running");
  
})