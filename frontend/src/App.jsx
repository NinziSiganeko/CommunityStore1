import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import ProductDetails from "./pages/ProductDetails";
import Message from "./pages/Message";
import ChatList from "./pages/ChatList";
import "./styles/CommunityStore.css";
import PersonalInformation from "./pages/PersonalInformation";
import PaymentMethods from "./pages/PaymentMethods";

function App() {
  return (
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/product" element={<ProductDetails />} />
          <Route path="/message" element={<Message />} />
          <Route path="/chat" element={<ChatList />} />
          <Route path="/sell" element={<Home />} />
          <Route path="/personal-information" element={<PersonalInformation />} />
          <Route path="/payment-methods" element={<PaymentMethods />} />
        </Routes>
      </BrowserRouter>
  );
}

export default App;
