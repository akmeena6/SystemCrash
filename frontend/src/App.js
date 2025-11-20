// App.js
import React from 'react';
import Register from './components/register/register'; // Adjust the path based on your project structure
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

import Login from './components/login/login';
import Home from './components/homepage/homepage';
import ForgotPassword from './components/forgotpassword/forgotpassword';
import SellPage from './components/sellpage/sellpage';
import ProfilePage from './components/profile/profilepage/profilepage';
import Transactions from './components/profile/transactions/transactions';
import Notifications from './components/notifications/notifications';
import ChangePassword from './components/profile/changepassword/changepassword';
import ChatPage from './components/chatpage/chatpage';
import ProductViewPage from './components/homepage/productview';
import Wishlist from './components/wishlist/Wishlist';
import UploadedItems from './components/uploadeditems/uploadeditems';
import EditProducts from './components/sellpage/editproducts';


import Otp from './components/otp/Otp';

import { AuthProvider } from './context/AuthProvider';



const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register/>} />
          <Route path="/home" element={<Home />} />
          <Route path="/forgotpassword" element={<ForgotPassword />} />
          <Route path="/sellpage" element={<SellPage />} />

          <Route path="/editproducts/:product_id" element={<EditProducts />} />

          <Route path="/chat/:userId" element={<ChatPage />} />
          
          <Route path="/otp" element={<Otp/>} />

          <Route path='/profilepage' element= {<ProfilePage/>}/>
          <Route path='/transactions' element= {<Transactions />}/> 
          <Route path='/changepassword' element= {<ChangePassword />}/> 

          <Route path='/notify' element= {<Notifications />}/> 
          <Route path='/chatpage' element = {<ChatPage/>} />
          <Route path='/productview/:product_id' element = {<ProductViewPage/>}/>
          <Route path="/wishlist" element={<Wishlist />} />

          <Route path="/uploadeditems" element={<UploadedItems />} />


        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;