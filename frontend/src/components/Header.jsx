import React from 'react';
import NavHeader from './NavHeader';

// This is a compatibility component that just renders NavHeader
// to support any components that might still be importing './Header'
const Header = () => {
  return <NavHeader />;
};

export default Header;
