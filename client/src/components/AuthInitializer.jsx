import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { checkAuthStatus } from '../store/authSlice';

const AuthInitializer = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(checkAuthStatus());
  }, [dispatch]);

  return null;
};

export default AuthInitializer;
