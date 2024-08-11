import './App.css';
import { useEffect, useState } from 'react';
import axios from 'axios';
import ChartD from './ChartD';
import {ClipLoader} from 'react-spinners';
import io from 'socket.io-client';

function App() {
  const [mainorders, setMain] = useState([]);
  const [corders, setCorders] = useState([]);
  const [isLoad,setLoad] = useState(false);
  const socket = io('http://localhost:3001');

  const loadMain = (b,s) => {
    b.sort((a1,b1) => b1.buyer_price-a1.buyer_price);
    s.sort((a1,b1) => a1.seller_price-b1.seller_price);
    console.log(b,s);
    if(b.length>=s.length){
      for(let i in b){
        if(i<s.length){
          b[i].seller_price = s[i].seller_price;
          b[i].seller_qty = s[i].seller_qty;
        }
        setMain(b);
      }
    }
    else{
      for(let i in s){
        if(i<b.length){
          s[i].buyer_price = b[i].buyer_price;
          s[i].buyer_qty = b[i].buyer_qty;
        }
        setMain(s);
      }
    }
    setLoad(false)
  }

  const loaddata = () => {
    axios.get("http://localhost:3001/getpdata").then(res => {
      loadMain(res.data[0],res.data[1]);
    }).catch(console.log("Error occured"));
    axios.get("http://localhost:3001/getcdata").then(res => {
      setCorders(res.data);
    }).catch(console.log("Error occured"));
  }

const postData = (type, id, price, qty) => {
    setLoad(true);
    let maxo = "corders";
    axios.get("http://localhost:3001/getMaxId", {maxo}).then(res => {
      if(res.data===false) alert("Could not process your data!")
      else {
        let cid = res.data;
        axios.post("http://localhost:3001/postdata",{type, cid, id, price, qty}).then(res => {
          console.log(res.data)
        }).catch(e => {
          console.log(e);
        });
      }
    }).catch("Error occured")
    setTimeout(window.location.reload(),2000);
  }

  useEffect(() => {
    setLoad(true);
    loaddata()
  },[]);
  useEffect( () => {
    socket.on('activate', () => {
      loaddata();
    });
  },[])

  const handleSubmit = (event) => {
    event.preventDefault();
    let type=event.target.type.value;
    let price=event.target.price.value;
    let qty=event.target.qty.value;
    if(type==='select') alert("Please select your user type!");
    else if(price<1) alert("Price should be greater than zero(0)!");
    else if(qty<1) alert("Quantity should be greater than zero(0)!");
    else {
      let maxo = "porders"
      axios.get("http://localhost:3001/getMaxId", {maxo}).then(res => {
        if(res.data===false) alert("Could not process your data!")
        else  postData(type,res.data,price,qty);
      }).catch("Error occured")
    }
  }
  return (
    <div id='container'>
      <div id='loader'>
        {isLoad && <ClipLoader color='blue'/>} 
      </div>
      <div className='ordermatching'>
      <div>
      <h3>Pending Orders</h3>
      <table>
        <thead>
          <tr className='phead'>
            <th>Buyer Qty</th>
            <th>Buyer Price</th>
            <th>Seller Price</th>
            <th>Seller Qty</th>
          </tr>
          </thead>
          <tbody>
        {mainorders.map(item => 
          <tr>
            <td>{item.buyer_qty}</td>
            <td>{item.buyer_price}</td>
            <td>{item.seller_price}</td>
            <td>{item.seller_qty}</td>
          </tr>
        )}
        </tbody>
      </table>
      <h3>Completed Orders</h3>
      <table>
          <tr className='chead'>
            <th>Price</th>
            <th>Qty</th>
          </tr>
        {corders.map(item => 
          <tr>
            <td>{item.price}</td>
            <td>{item.qty}</td>
          </tr>
        )}
      </table>
      <form onSubmit={handleSubmit}>
        <tr>
        <td><label htmlFor='type'>Select your choice: </label></td>
        <td><select name = 'type'>
          <option value='select'>--select--</option>
          <option value='buy'>Buy</option>
          <option value='sell'>Sell</option>
        </select></td>
        </tr>
        <tr>
        <td><label htmlFor='price'>Enter Price: </label></td>
        <td><input name='price' type='number'></input></td>
        </tr>
        <tr>
        <td><label htmlFor='qty'>Enter Quantity: </label></td>
        <td><input name = 'qty' type='number'></input></td>
        </tr>
        <tr><td id='submit' colSpan={2}><input id='submitb' type='submit'></input></td></tr>
      </form>
      </div>
      <div id='chart'>
        <ChartD items={corders}/>
      </div>
      </div>
    </div>
  );
}

export default App;
