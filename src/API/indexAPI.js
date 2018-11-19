class Helper {
  //create the base URL
  static baseUrl(){
    return "https://api.foursquare.com/v2"
  }
  //foursquare API authorization
  static authorization() {
    const clientKeys = {
      client_id:"ON5NTJNBA2WZAJVSUGZZXHPATH0CYTUXARTOHHZZLCXTPXDR",
      client_secret:"WZEXWDXP243TIRPQNDQQQDRHXFJZL2HPI1ZE1AZZBASH3B1G",
      v:"20181119"
    };
    //format the clientKeys
    return Object.keys(clientKeys).map(key=>
    `${key}=${clientKeys[key]}`)
    .join("&");
  }
  static buildUrl(urlParams){
    if(!urlParams){
      return ""
    }
    // format the URL Parameters
    return Object.keys(urlParams).map(key=>
    `${key}=${urlParams[key]}`)
    .join("&");
  }
  static headers() {
    return {
      Accept: "application/json"
    };
  }
  static async simpleFetch(endPoint,method,urlParams){
    let requestData = {
      method,
      headers: Helper.headers()
    };
    const result_3 = await fetch(`${Helper.baseUrl()}${endPoint}?${Helper.authorization()}&${Helper.buildUrl(urlParams)}`, requestData);
    return result_3.json();
  }
} 

export default class indexAPI {
  static search(urlParams) {
    return Helper.simpleFetch("/venues/search", "GET", urlParams);
  }
  static getVenueDetails(VENUE_ID) {
    return Helper.simpleFetch(`/venues/${VENUE_ID}`, "GET");
  }
  static getVenuePhotos(VENUE_ID) {
    return Helper.simpleFetch(`/venues/${VENUE_ID}/photos`, "GET");
  }
}
