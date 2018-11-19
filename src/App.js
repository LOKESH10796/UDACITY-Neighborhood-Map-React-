import React, { Component } from "react";
import "./App.css";
import Map from "./Components/Map";
import indexAPI from "./API/indexAPI";
import Sidebar from "./Components/Sidebar";

const searchVenueParams = [
  {
    near: "Pune, Mahārāshtra, India",
    query: "Café GoodLuck",
    ll: "18.517247, 73.841487",
    limit: 1
  },
  {
    near: "Pune, Mahārāshtra, India",
    query: "Incognito",
    ll: "18.561770, 73.916895",
    limit: 1
  },
  {
    near: "Pune, Mahārāshtra, India",
    query: "Hard Rock Cafe",
    ll: "18.5390, 73.9128",
    limit: 1
  },
  {
    near: "Pune, Mahārāshtra, India",
    query: "Barbeque Nation Pune",
    ll: "18.5165, 73.8423",
    limit: 1
  },
  {
    near: "Pune, Mahārāshtra, India",
    query: "Cafe Goa",
    ll: "18.5618, 73.9071",
    limit: 1
  },
  {
    near: "Pune, Mahārāshtra, India",
    query: "Blue Nile",
    ll: "18.5219, 73.8775",
    limit: 1
  },
  {
    near: "Pune, Mahārāshtra, India",
    query: "Way Down South",
    ll: "18.5664, 73.7708",
    limit: 1
  },
  {
    near: "Pune, Mahārāshtra, India",
    query: "Suonmoi Chinese Restaurant",
    ll: "18.5375, 73.8797",
    limit: 1
  },
  {
    near: "Pune, Mahārāshtra, India",
    query: "The Bounty Sizzlers",
    ll: "18.5488, 73.9054",
    limit: 1
  },
  {
    near: "Pune, Mahārāshtra, India",
    query: "Little Italy",
    ll: "18.5350, 73.8382",
    limit: 1
  }
];

class App extends Component {
  constructor() {
    super();
    this.state = {
      venues: [],
      markers: [],
      zoom: 11,
      apiError: false,
      updateSuperState: obj => {
        this.setState(obj);
      }
    };
  }
  // function to close all open infoWindows
  closeInfoWindows = () => {
    const markers = this.state.markers.map(marker => {
      marker.isOpen = false;
      return marker;
    });
    this.setState({ markers: Object.assign(this.state.markers, markers) });
  };
  //function to show infoWindow on MarkerClick
  markerClicked = marker => {
    this.clearMarkers();
    this.closeInfoWindows();
    marker.isOpen = true;
    this.setState({ markers: Object.assign(this.state.markers, marker) });
  };
  // function to animate the markers when a restaurant is clicked in the sidebar
  animateMarker = marker => {
    this.clearMarkers();
    marker.animate = true;
    this.setState({ markers: Object.assign(this.state.markers, marker) });
  };
  // function to set animations to only one at a time
  clearMarkers = () => {
    const markers = this.state.markers.map(marker => {
      marker.animate = false;
      return marker;
    });
    this.setState({ markers: Object.assign(this.state.markers, markers) });
  };
  // function to animate marker/open the infoWindow when a restaurant is clicked in sidebar
  restaurantClicked = venue => {
    const restaurantMarker = this.state.markers.find(
      marker => marker.id === venue.id
    );
    this.markerClicked(restaurantMarker);
    this.animateMarker(restaurantMarker);
  };

  infoClicked = () => {
    alert(
      "Restaurants in my neighbourhood I would like to visit sometime soon."
    );
  };
  
  componentDidMount() {
    for (var i = 0; i < searchVenueParams.length; i++) {
      indexAPI
        .search(searchVenueParams[i])
        .then(retval => {
          var newVenues = this.state.venues;
          var newMarkers = this.state.markers;
          var idx = 0;
          while (
            retval.response.venues[idx].location.address === undefined &&
            idx < retval.response.venues.length - 1
          ) {
            idx++;
          }
          newVenues.push(retval.response.venues[idx]);
          newMarkers.push({
            lat: retval.response.venues[idx].location.lat,
            lng: retval.response.venues[idx].location.lng,
            isOpen: false,
            isVisible: true,
            id: retval.response.venues[idx].id,
            animate: false
          });
          this.setState({ venues: newVenues, markers: newMarkers });
        })
        .catch(error => {
          this.setState({ apiError: true });
        });
    }
  }

  render() {
    return (
      <div role="main" className="App">
        <Sidebar
          {...this.state}
          restaurantClicked={this.restaurantClicked}
          infoClicked={this.infoClicked}
        />
        <Map {...this.state} markerClicked={this.markerClicked} />
      </div>
    );
  }
}

export default App;
