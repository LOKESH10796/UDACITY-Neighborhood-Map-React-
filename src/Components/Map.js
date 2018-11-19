/*global google*/
import React, { Component } from 'react'
import { withScriptjs, withGoogleMap, GoogleMap, Marker, InfoWindow} from "react-google-maps";

const MapComponent = withScriptjs(
  withGoogleMap((props) =>
  <GoogleMap
    defaultZoom={8}
    zoom = {props.zoom}
    defaultCenter={{ lat: 18.5204, lng: 73.8567 }}
  >
    {props.markers &&
      props.markers.filter(marker=> marker.isVisible).map((marker,id) => {
        const restaurantData = props.venues.find(venue=>venue.id === marker.id);
        return (
          <Marker
            key={id}
            position={{ lat: marker.lat, lng: marker.lng }}
            onClick={()=> props.markerClicked(marker)}
            animation = {marker.animate === false ? google.maps.Animation.null : google.maps.Animation.BOUNCE}
          >
          {marker.isOpen && (
            <InfoWindow>
              <React.Fragment>
                <p><strong>{restaurantData.name}</strong></p>
                  <p>{restaurantData.location.address}<br/>
                  {restaurantData.location.city}, {restaurantData.location.state}, {restaurantData.location.postalCode}</p>
                  <p><small><sub>Restaurant information provided by Foursquare&reg;</sub></small></p>
              </React.Fragment>
            </InfoWindow>
          )}
          </Marker>
        );
      })}
  </GoogleMap>
));

class Map extends Component {
  constructor(props) {
    super(props);
    this.state = {hasError: false};
  }

  componentDidCatch(error, info) {
    this.setState({hasError: true});
  }
  render() {
    if (this.state.hasError){
      return (
        <div className = "mapError">
          <React.Fragment>
            <p><strong> The map did not load. </strong></p>
          </React.Fragment>
        </div>
      )
    }
    return (

        <MapComponent
          {...this.props}
          googleMapURL="https://maps.googleapis.com/maps/api/js?v=3.exp&key=AIzaSyAnYNuyM0bSR6w1oo4jqBn_oXzh0JiUZMY"
          loadingElement={<div style={{ height: `100%` }} />}
          containerElement={<div style={{ height: `120%`, width: `75%` }} />}
          mapElement={<div style={{ height: `120%` }} />}
        />
    )
  }
}

export default Map
