const express=require('express');
const app=express();
const PORT=5001;

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.sendStatus(204);
    }

    next();
});

app.get('/api',(req,res)=>{
    res.send('Hello World');
});
 
app.listen(PORT,()=>{
    console.log(`Server is running on port ${PORT}`);
});
