import React from 'react';
import axios from 'axios';
import ReactDOM from "react-dom";
import Config from './config'
import LoadingImg from './loading.gif';
import Countries from "./countries.json";
import './App.css';

class App extends React.Component{
  
  constructor(props) {
    super(props);
    this.onChangeUpdate = this.onChangeUpdate.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
    this.state = {
      isLoading: false,
      initialSearch: true,
      userResult: [],
      requestUrl: {},
      currentPage: 1,
      userCount: "",
    }
  }

  
  //get user details based on the search filter
  onSubmit = (e, page=1) => {
    let requestUrl = this.state.requestUrl;
    let query = "";
    
    if(Object.keys(requestUrl).length>0) {
      query += requestUrl.searchUser;
      if(requestUrl.repooperators!=="" && requestUrl.repooperators!==undefined) {
        query += "+repos:"+requestUrl.repooperators+requestUrl.repository;
      }
      if(requestUrl.followoperators!=="" && requestUrl.followoperators!==undefined) {
        query += "+followers:"+requestUrl.followoperators+requestUrl.followers;
      }
      if(requestUrl.location!=="" && requestUrl.location!==undefined) {
        query += "+location:"+requestUrl.location;
      }
    }
   
    this.setState({
      isLoading: true,
      currentPage: page,
      initialSearch: false
    });

    let mainObject = this;
    axios.get(Config.githubApiUrl+'?client_id='+Config.githubClientId+'&client_secret='+Config.githubClientSecretKey+'&q='+query+'&page='+page+'&per_page='+Config.listUsersPerPage+'&sort=followers&order=asc')
      .then(response => {
        
        this.setState({
          userResult: [],
          userCount: response.data.total_count,
        });                 
        
        if(response.data.items.length > 0) {
          response.data.items.forEach(function(item, index, arr){
            mainObject.getIndividualUserDetails(item.url+'?client_id='+Config.githubClientId+'&client_secret='+Config.githubClientSecretKey);
          });
        } else {
          this.setState({
            userResult : [],
            isLoading: false,
          });
        }
      }).catch(function (error) {
        mainObject.setState({
          currentPage: page
        });
      });
    e.preventDefault();
  }


  //get detailed information about individual user
  getIndividualUserDetails = (userUrl) => {
    axios.get(userUrl)
      .then(response => {  
        this.setState({
          userResult: this.state.userResult.concat(response.data),
          isLoading: false,
        });
      }).catch(function (error) {
        console.log(error);
      });
  }
 
  
  //add filters in the request url on updating the form
  onChangeUpdate = (e) => {
    e.persist();
    let returnObj = {};
    if(Object.keys(this.state.requestUrl).length>0) {
      let mainObject = this;
      Object.keys(this.state.requestUrl).forEach(function (item) {
          returnObj[item] = mainObject.state.requestUrl[item];          
      });
    }
    returnObj[e.target.name] = e.target.value;
    this.setState({
      requestUrl : returnObj
    }, ()=>{
      if(this.state.requestUrl.repooperators==="") {
        ReactDOM.findDOMNode(this.refs.repos).value = "";
      }
      if(this.state.requestUrl.followoperators==="") {
        ReactDOM.findDOMNode(this.refs.follows).value = "";
      }  
    });
    e.preventDefault();
  }


  //pagination with dots
  pagination = (currentPage, totalPages) => {
    var nextAdditionalPages = 2,
        left = currentPage - nextAdditionalPages,
        right = currentPage + nextAdditionalPages + 1,
        range = [],
        rangeWithDots = [],
        l;

    for(let i = 1; i <= totalPages; i++) {
      if(i === 1 || i === totalPages || i >= left && i < right) {
        range.push(i);
      }
    }
    
    for(let i of range) {
      if(l) {
        if(i-l === 2) {
          rangeWithDots.push(<button key={l+1} onClick={(e)=>this.onSubmit(e, l+1)}>{l+1}</button>);
        } else if(i-l !== 1) {
          rangeWithDots.push('...');
        }
      }
                
      if(this.state.currentPage===i) {    
        rangeWithDots.push(<button className="active-page" key={i} onClick={(e)=>this.onSubmit(e, i)}>{i}</button>);
      } else {
        rangeWithDots.push(<button key={i} onClick={(e)=>this.onSubmit(e, i)}>{i}</button>);
      }  
      l = i;
    }
    return rangeWithDots;
  }


  //render html results
  render = () => {
    let currentPage = this.state.currentPage;
    let userDetails = [];
    let countryList = [];
    let bodyContent = "";
    let pagination = "";
    let repo = "";
    let follows = "";
    let limitExceeded = "";    
        
    if(Object.keys(this.state.requestUrl).length>0) {
      repo = this.state.requestUrl.repooperators;
      follows = this.state.requestUrl.followoperators; 
    }
    
    //right side body content for displaying search results
    if(this.state.isLoading===true) {
      bodyContent = <img className="loading-img" alt="Loading..." src={LoadingImg} />;
    } else {
      if(this.state.userResult.length > 0) {
        this.state.userResult.forEach(function(item, index, arr){
          userDetails.push(
            <div className="user-detail-wrap" key={item.id}>
              <h2>{(item.name!==null)? item.name:item.login} (<strong>User Id:</strong> {item.id})</h2>
              <div className="user-detail">
                <div className="user-image">
                  <img className="profile-pic" alt={item.login} src={item.avatar_url} />
                </div>
                <div className="user-rightside">
                  <p><strong>Email: </strong>{item.email!==null ? item.email : 'N/A'}</p>
                  <p><strong>Company: </strong>{item.company!==null ? item.company : 'N/A'}</p>
                  <p><strong>Bio: </strong>{item.bio!==null ? item.bio : 'N/A'}</p>
                  <p><strong>Location: </strong>{item.location!==null ? item.location : 'N/A'}</p>
                  <p><strong>Repositories: </strong>{item.public_repos!==null ? item.public_repos : 'N/A'}</p>
                  <p><strong>Followers: </strong>{item.followers!==null ? item.followers : 'N/A'}</p>
                  <p><strong>Created At: </strong>{item.created_at!==null ? item.created_at : 'N/A'}</p>
                  <a href={item.html_url} target="_blank">View</a>
                </div>   
              </div>
            </div>
          );
        });
        bodyContent = userDetails;
      } else {
        bodyContent = <h2 className="text-center">No results found for your search.</h2>
      }
    }  

    
    if(this.state.userCount > Config.listUsersPerPage) {
      let totalPages = Math.ceil(this.state.userCount / Config.listUsersPerPage);

      //pagination content
      pagination = 
        <div>
          <div className="pagination">
          <button className={currentPage===1 ? 'button-disabled' : ''} onClick={(e)=>this.onSubmit(e, this.state.currentPage-1)}>Previous</button>
          {this.pagination(currentPage, totalPages)}
          <button className={currentPage===totalPages ? 'button-disabled' : ''} onClick={(e)=>this.onSubmit(e, this.state.currentPage+1)}>Next</button>
          </div>
        </div>;

      //Only the first 1000 search results are available from Github Api so display popup if user execeeds the search above 1000  
      if(this.state.userCount > 1000 && currentPage === totalPages) { 
        limitExceeded = 
        <div>
          <div className="popup-overlay"></div>  
          <div className="popup-container">
            <a href="#" onClick={(e)=>this.onSubmit(e, 1)}>X</a>
            <h2>GitHub API limits searches to 1000 results so we have displayed only first 1000 available results.</h2>
          </div>
        </div>
      }  
    }

    //countries list
    Countries.forEach(function(item, index, arr){
      countryList.push(<option key={item} value={item}>{item}</option>);
    });


    if(Config.githubClientId==="" || Config.githubClientSecretKey==="" || Config.githubApiUrl==="") {
      return <h2>Some of the configuration is missing. Please check the config.js file and fill out the empty values.</h2>
    }

    
    //html body content
    if(this.state.initialSearch===true) {
      return (
        <div className="initial-search">
          <h2 className="title1">Search Github users</h2>
          <form onSubmit={(e) => this.onSubmit(e, 1)} className="search-form1"> 
            <input className="form-field1" type="text" name="searchUser" defaultValue="" onChange={(e) => this.onChangeUpdate(e)} placeholder="User Name" required="NON_NULL"/>
            <input className="form-submit1" type="submit" name="searchUserSubmit" value="Search" />
          </form>
        </div>  
      );
    } else {
      return (
        <div>
          {limitExceeded}
          <div className="body-container">
            <div className="body-left-cont">
              <h2 className="title">Filter users</h2>
              <form onSubmit={(e) => this.onSubmit(e, 1)} className="search-form">
                <div className="field-group">
                  <label>User Name:</label>
                  <input className="form-field" type="text" name="searchUser" value={this.state.requestUrl.searchUser} onChange={(e) => this.onChangeUpdate(e)} placeholder="User Name" required="NON_NULL"/>
                </div>
                <div className="field-group">
                  <label>Location:</label>
                  <select className="form-field form-select" name="location" onChange={(e) => this.onChangeUpdate(e)}>
                    <option value="">Select Location</option>
                    {countryList}
                  </select>
                </div>
                <div className="field-group">
                  <label>Repository Count:</label>
                  <select className="form-select1" name="repooperators" onChange={(e) => this.onChangeUpdate(e)}>
                    <option value="">Select</option>
                    <option value=">">Greater than</option>
                    <option value="<">Lesser than</option>
                  </select>
                  <input className="form-field select-text" type="number" name="repository" defaultValue="" onChange={(e) => this.onChangeUpdate(e)} placeholder="No of Repositories" disabled={(repo!==undefined && repo!=="")? "" : "disabled"} required={(repo!==undefined && repo!=="")? "NON_NULL" : ""} ref="repos"/>
                </div>
                <div className="field-group">
                  <label>Followers:</label>
                  <select className="form-select1" name="followoperators" onChange={(e) => this.onChangeUpdate(e)}>
                    <option value="">Select</option>
                    <option value=">">Greater than</option>
                    <option value="<">Lesser than</option>
                  </select>
                  <input className="form-field select-text" type="number" name="followers" defaultValue="" onChange={(e) => this.onChangeUpdate(e)} placeholder="No of Followers" disabled={(follows!==undefined && follows!=="")? "" : "disabled"} required={(follows!==undefined && follows!=="")? "NON_NULL" : ""} ref="follows"/>
                </div>  
                <input className="form-submit" type="submit" name="searchUserSubmit" value="Search" />
              </form>
            </div>
            <div className="body-right-cont">
              <h2 className="title2">User Results</h2>
              {(this.state.userCount>0)? <p className="totalcount"><strong>Total Count:</strong> {this.state.userCount}</p>:""}
              {pagination}
              <div className="user-detail-cont">
                {bodyContent}
              </div>
            </div>
          </div>
        </div>  
      );
    }  

  }
}

export default App;