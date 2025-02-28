import { useState } from "react";
import { registerUser } from "../services/api";
import { useNavigate } from "react-router-dom";

const Register = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    hobbies: "",
    interests: "",
   
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await registerUser({
        ...formData,
        preferences: {
          hobbies: formData.hobbies.split(","),
          interests: formData.interests.split(","),
          
        },
      });
      navigate("/login");
    } catch (err) {
      alert("Registration failed");
      console.log(err)
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input type="text" name="name" placeholder="Name" onChange={handleChange} required />
      <input type="email" name="email" placeholder="Email" onChange={handleChange} required />
      <input type="password" name="password" placeholder="Password" onChange={handleChange} required />
      <input type="text" name="hobbies" placeholder="Hobbies (comma-separated)" onChange={handleChange} />
      <input type="text" name="interests" placeholder="Interests (comma-separated)" onChange={handleChange} />
      
      <button type="submit">Register</button>
    </form>
  );
};

export default Register;
