import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Text } from 'react-native-elements';

export default class Token extends Component {

  static propTypes() {
    return {
      token: PropTypes.shape({
        id: PropTypes.string, // identifier for token in db (TODO)
        expiresBy: PropTypes.string, // ISO date format
      }).isRequired,
    }
  }

  constructor(props) {
      super(props);
  }

  render() {
    return(
      <Text>{JSON.stringify(this.props.token)}</Text>
    );
  }
}