import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Register.css';

function Register() {
  const { register } = useAuth();
  const [form, setForm] = useState({
    firstname: '',
    lastname: '',
    email: '',
    number: '',
    password: '',
    confirmPassword: '',
    age: '',
    weight: '',
    height: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    const result = await register({
      firstname: form.firstname,
      lastname: form.lastname,
      email: form.email,
      number: form.number,
      password: form.password,
      age: form.age ? Number(form.age) : undefined,
      weight: form.weight ? Number(form.weight) : undefined,
      height: form.height ? Number(form.height) : undefined,
    });

    if (!result.success) {
      setError(result.message);
    }

    setLoading(false);
  };

  return (
    <div className="register-container">
      <div className="register-box">
        <h1>Create Account</h1>
        <p className="register-subtitle">Join GymBro and start tracking your workouts</p>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="firstname">First Name</label>
              <input
                id="firstname"
                name="firstname"
                type="text"
                value={form.firstname}
                onChange={handleChange}
                required
                placeholder="First name"
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <label htmlFor="lastname">Last Name</label>
              <input
                id="lastname"
                name="lastname"
                type="text"
                value={form.lastname}
                onChange={handleChange}
                required
                placeholder="Last name"
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              required
              placeholder="Enter your email"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="number">Phone Number</label>
            <input
              id="number"
              name="number"
              type="tel"
              value={form.number}
              onChange={handleChange}
              required
              placeholder="Enter your phone number"
              disabled={loading}
            />
          </div>

          <div className="form-section-label">Body Stats <span className="optional-badge">optional</span></div>
          <div className="form-row form-row-3">
            <div className="form-group">
              <label htmlFor="age">Age</label>
              <div className="input-unit-wrap">
                <input
                  id="age"
                  name="age"
                  type="number"
                  value={form.age}
                  onChange={handleChange}
                  placeholder="25"
                  min="1"
                  max="120"
                  disabled={loading}
                />
                <span className="input-unit">yrs</span>
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="weight">Weight</label>
              <div className="input-unit-wrap">
                <input
                  id="weight"
                  name="weight"
                  type="number"
                  value={form.weight}
                  onChange={handleChange}
                  placeholder="70"
                  min="1"
                  disabled={loading}
                />
                <span className="input-unit">kg</span>
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="height">Height</label>
              <div className="input-unit-wrap">
                <input
                  id="height"
                  name="height"
                  type="number"
                  value={form.height}
                  onChange={handleChange}
                  placeholder="175"
                  min="1"
                  disabled={loading}
                />
                <span className="input-unit">cm</span>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              required
              placeholder="Create a password"
              minLength={6}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={form.confirmPassword}
              onChange={handleChange}
              required
              placeholder="Repeat your password"
              disabled={loading}
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="register-button" disabled={loading}>
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <p className="register-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
