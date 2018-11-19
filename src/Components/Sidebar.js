import React, { Component } from 'react'
import RestaurantList from './RestaurantList'

class Sidebar extends Component {
  constructor (props) {
    super(props);
    this.state = {
      query: ""
    };
  }
  // function to end a marker's animation
  endAnimation = () =>{
    const markers = this.props.markers.map(marker => {
      marker.animate = false;
      return marker;
    });
    this.props.updateSuperState({markers});
  }
  // function that filters map markers based on the search
  searchRestaurants = event => {
    this.setState({query: event.target.value});
    // the markers returned match the venues that contain the searched for text
    const markers = this.props.venues.map(venue => {
      const query = event.target.value;
      // matchFound will return true/false if the venue contains the searched for text
      const matchFound = venue.name.toLowerCase().includes(query.toLowerCase());
      // marker links the marker and the venue by id
      const marker = this.props.markers.find(marker=>marker.id === venue.id);
      marker.animate = false;
      if(matchFound) {
        marker.isVisible = true;
      }
      else {
        marker.isVisible = false;
      }
      return marker;
    });
    //update the visibility of the markers
    this.props.updateSuperState({markers});
  }

  //function to filter the restaurants in the sidebar based on the search
  handleFilterRestaurants = () => {
    if(this.state.query.trim() !== "") {
      const venues = this.props.venues.filter(venue =>
        venue.name.toLowerCase().includes(this.state.query.toLowerCase())
      );
      return venues;
    }
    return this.props.venues;
  }

  render() {
    return (
      <div className = "sidebar">
        <h3> Neighbourhood Restaurant Map </h3>
        <h4> Pune, Mahārāshtra, India </h4>
        <label htmlFor="search" className = "visuallyhidden"> More information button:</label>
        <p><button type = {"button"} id = {"infoButton"} onClick={() => this.props.infoClicked()}> More Info </button> </p>
        <label htmlFor="search" className = "visuallyhidden"> Search Restaurants:</label>
        <input
          type = {"search"}
          id = {"search"}
          placeholder = {"Search Restaurants"}
          onChange = {this.searchRestaurants}
          onClick = {this.endAnimation}
        />
        <
          RestaurantList {...this.props}
          venues = {this.handleFilterRestaurants()}
          restaurantClicked = {this.props.restaurantClicked}
        />
      </div>
    )
  }
}

export default Sidebar
