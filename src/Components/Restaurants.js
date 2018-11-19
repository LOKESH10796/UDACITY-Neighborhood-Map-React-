import React, { Component } from 'react'

class Restaurants extends Component {
  render() {
    return (
      <li className="restaurants"
      tabIndex = "0"
      onClick={() => this.props.restaurantClicked(this.props)}>
        {this.props.name}
        <p><small>
          {this.props.location.address} <br/>
          {this.props.location.city},
          {this.props.location.state},
          {this.props.location.postalCode}
        </small></p>

      </li>

    )
  }
}

export default Restaurants
