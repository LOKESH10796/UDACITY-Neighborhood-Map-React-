import React, { Component } from 'react'
import Restaurants from './Restaurants'

class RestaurantList extends Component {
  render() {

    return (
      <ol className="restaurantList">
        {this.props.venues.length > 0 && this.props.venues &&
          this.props.venues.map((restaurant,id)=>(
            <Restaurants key={id} {...restaurant}
            restaurantClicked = {this.props.restaurantClicked}/>
          ))}
          {this.props.apiError === true &&
            <span> Something went wrong. </span>
          }
      </ol>
    )
  }
}

export default RestaurantList
