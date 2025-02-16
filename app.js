//import React from 'react';
//import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

class App extends React.Component {
  constructor(props) {
    super(props);

    const savedLoggedIn = localStorage.getItem("loggedIn") === "true";
    const savedUserName = localStorage.getItem("userName") || "";

    this.state = {
      entries: [],
      page: window.location.hash.replace("#", "") || "login",
      numBusPasses: 0,
      numUtilities: 0,
      numFoodBags: 0,
      dashboardMessage: "",
      userName: savedUserName,
      loggedIn: savedLoggedIn,
      editingEntry: null
    };
    this.logIn = this.logIn.bind(this);
    this.logOut = this.logOut.bind(this);
    this.fetchServices = this.fetchServices.bind(this);
    this.addEntry = this.addEntry.bind(this);
    this.editEntry = this.editEntry.bind(this);
    this.deleteEntry = this.deleteEntry.bind(this);
    this.startEditing = this.startEditing.bind(this);
    this.addFoodBag = this.addFoodBag.bind(this);
    this.subtractFoodBag = this.subtractFoodBag.bind(this);
    this.sortEntries = this.sortEntries.bind(this); 
    this.clearEditingEntry = this.clearEditingEntry.bind(this);
    this.redirect = this.redirect.bind(this);
    this.setUserName = this.setUserName.bind(this);
  }

  componentDidMount() {
    this.fetchNumFoodBags();
    this.createDashboardMessage();

    if(!window.location.hash) {
      window.location.hash = "#login";
    }

    window.addEventListener("hashchange", () => {
      this.setState({ page: window.location.hash.replace("#", "") });
    });

    const savedLoggedIn = localStorage.getItem("loggedIn") === "true";
    if(savedLoggedIn) {
      this.setState({
        loggedIn: true,
        page: "home"
      }, () => {
        this.fetchServices();
        this.fetchNumFoodBags();
      })
    }

  }

  componentDidUpdate(prevProps, prevState) {
    if(prevState.userName !== this.state.userName) {
      this.createDashboardMessage();
    }
  }

  redirect(toPage) {
    this.setState({
      page: toPage
    })
  }

  logIn() {
    this.setState({ 
      loggedIn: true 
    }, () => {
      localStorage.setItem("loggedIn", "true");
    });
  }

  logOut() {
    this.setState({ 
      loggedIn: false,
      userName: ""
    }, () => {
      localStorage.removeItem("loggedIn");
      localStorage.removeItem("userName");
    });
  }

  setUserName(name) {
    this.setState({
      userName: name
    }, () => {
      localStorage.setItem("userName", name);
    });
  }

  fetchServices() {
    return fetch("https://api.rccgoodsamaritan.org/apiProxy.php?endpoint=getServices.php")
      .then(response => {
        if(!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then(data => {
        if(!data.success) {
          throw new Error(data.error || "Failed to fetch services.");
        }

        //console.log("Entries upon fetch: " + JSON.stringify(data.data, null, 2));
        this.setState({
          entries: data.data,
          numBusPasses: data.data.filter(e => e.service === "Bus Pass").length,
          numUtilities: data.data.filter(e => e.service === "Utility").length,
      
        });
        return true;
      })
      .catch(error => {
        console.error("Error fetching services: ", error);
        throw error;
    });
  }

  addEntry (entryState) {
    const formData = new FormData();
    formData.append("id", entryState.id || Date.now());
    formData.append("date", entryState.date);
    formData.append("name", entryState.name);
    formData.append("service", entryState.service);
    formData.append("foodBag", entryState.foodBag);
    formData.append("notes", entryState.notes);
    //console.log(entryState.foodBag);

    fetch("https://api.rccgoodsamaritan.org/apiProxy.php?endpoint=insertService.php", {
      method: "POST", 
      body: formData
    })
    .then(response => {
      if(!response.ok) {
        throw Error("Network response was not ok");
      }
      return response.json();
    })
    .then(data => {
      if(!data.success) {
        throw new Error(data.error || "Failed to add entry");
      }
      if(entryState.foodBag) {
        this.addFoodBag();
      }
      return fetch("https://api.rccgoodsamaritan.org/apiProxy.php?endpoint=getServices.php");
    })
    .then(response => response.json())
    .then(updatedEntries => {
      
      this.setState({
        entries: updatedEntries.data,
        numBusPasses: updatedEntries.data.filter(e => e.service === "Bus Pass").length,
        numUtilities: updatedEntries.data.filter(e => e.service === "Utility").length
      });
    })
    .catch(error => console.error("Error adding entry:", error.message));
  }

  editEntry(updatedEntry) {
    const originalEntry = this.state.entries.find((entry) => entry.id === updatedEntry.id);

    const formData = new FormData();
    formData.append("id", updatedEntry.id);
    formData.append("date", updatedEntry.date);
    formData.append("name", updatedEntry.name);
    formData.append("service", updatedEntry.service);
    formData.append("foodBag", updatedEntry.foodBag);
    formData.append("notes", updatedEntry.notes);

    fetch("https://api.rccgoodsamaritan.org/apiProxy.php?endpoint=editService.php", {
      method: "POST",
      body: formData
    })
      .then(response => {
        if(!response.ok) {
          throw Error("Network response was not ok");
        }
        return response.json();
      })
      .then(data => {
        if(data.success) {
          if(originalEntry.foodBag === "0" && updatedEntry.foodBag === true) {
            console.log("adding food bag");
            this.addFoodBag();
          }
          if(originalEntry.foodBag === "1" && updatedEntry.foodBag === false) {
            console.log("subtracting food bag");
            this.subtractFoodBag();
          }
          return fetch("https://api.rccgoodsamaritan.org/apiProxy.php?endpoint=getServices.php");
        } 
        else {
          throw new Error("Failed to edit entry");
        }

      })
      .then(response => response.json())
      .then(updatedEntries => {
        
        this.setState({
          entries: updatedEntries.data,
          numBusPasses: updatedEntries.data.filter(e => e.service === "Bus Pass").length,
          numUtilities: updatedEntries.data.filter(e => e.service === "Utility").length,
          editingEntry: null
        });
      })
      .catch(error => console.error("Error editing entry:", error.message));
    
  }

  deleteEntry(deletedEntryId) {
    const entry = this.state.entries.find((entry) => entry.id === deletedEntryId);

    fetch("https://api.rccgoodsamaritan.org/apiProxy.php?endpoint=deleteService.php", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({id: deletedEntryId})
    })
      .then(response => {
        if(!response.ok) {
          throw Error("Network response was not ok");
        }
        return response.json();
      })
      .then(data => {
        if (data.success) {
          if(entry.foodBag === "1") {
            this.subtractFoodBag();
          }
          return fetch("https://api.rccgoodsamaritan.org/apiProxy.php?endpoint=getServices.php");
        } else {
          throw new Error("Failed to delete entry");
        }
      })
      .then(response => response.json())
      .then(updatedEntries => {
        this.setState({
          entries: updatedEntries.data,
          numBusPasses: updatedEntries.data.filter(e => e.service === "Bus Pass").length,
          numUtilities: updatedEntries.data.filter(e => e.service === "Utility").length,
          editingEntry: null
        });
      })
      .catch(error => console.error("Error deleting entry:", error));
  }

  fetchNumFoodBags() {
    return fetch("https://api.rccgoodsamaritan.org/apiProxy.php?endpoint=getFoodBags.php")
      .then(response => {
        if(!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then(data => {
        if(!data.success) {
          throw new Error(data.error || "Failed to fetch services.");
        }

        this.setState({
          numFoodBags: data.data[0].numFoodBags
        });
        return true;
      })
      .catch(error => {
        console.error("Error fetching services: ", error);
        throw error;
    });
  }

  addFoodBag() {
    const formData = new FormData();
    formData.append("numFoodBags", parseInt(this.state.numFoodBags) + 1);

    fetch("https://api.rccgoodsamaritan.org/apiProxy.php?endpoint=setFoodBags.php", {
      method: "POST", 
      body: formData
    })
    .then(response => {
      if(!response.ok) {
        throw Error("Network response was not ok");
      }
      return response.json();
    })
    .then(data => {
      if(!data.success) {
        throw new Error(data.error || "Failed to add entry");
      }

      return fetch("https://api.rccgoodsamaritan.org/apiProxy.php?endpoint=getFoodBags.php");
    })
    .then(response => response.json())
    .then(updatedEntries => {
      console.log(updatedEntries.data[0].numFoodBags);
      this.setState({
        numFoodBags: updatedEntries.data[0].numFoodBags
      });
    })
    .catch(error => console.error("Error adding entry:", error.message));
  }

  subtractFoodBag() {
    const formData = new FormData();
    formData.append("numFoodBags", parseInt(this.state.numFoodBags) - 1);

    fetch("https://api.rccgoodsamaritan.org/apiProxy.php?endpoint=setFoodBags.php", {
      method: "POST", 
      body: formData
    })
    .then(response => {
      if(!response.ok) {
        throw Error("Network response was not ok");
      }
      return response.json();
    })
    .then(data => {
      if(!data.success) {
        throw new Error(data.error || "Failed to add entry");
      }

      return fetch("https://api.rccgoodsamaritan.org/apiProxy.php?endpoint=getFoodBags.php");
    })
    .then(response => response.json())
    .then(updatedEntries => {
      console.log(updatedEntries.data[0].numFoodBags);
      this.setState({
        numFoodBags: updatedEntries.data[0].numFoodBags
      });
    })
    .catch(error => console.error("Error adding entry:", error.message));
  }

  startEditing(entry) {
    this.setState({
      editingEntry: entry,
      page: "form"
    })
  }

  sortEntries() {
    this.setState((prevState) => ({
      entries: [...prevState.entries].sort((a, b) => new Date(b.date) - new Date(a.date))
    }))
  }

  createDashboardMessage() {
    const currentHour = new Date().getHours();
    if(currentHour < 12) {
      this.setState({ dashboardMessage: "Good morning, " + this.state.userName + "!"});
    }
    else if(currentHour >= 12 && currentHour < 17) {
      this.setState({ dashboardMessage: "Good afternoon, " + this.state.userName + "!"});
    }
    else if(currentHour >= 17) {
      this.setState({ dashboardMessage: "Good evening, " + this.state.userName + "!"});
    }
  }

  clearEditingEntry() {
    this.setState({
      editingEntry: null
    })
  }

  render() {
    if((this.state.page === "home") && this.state.loggedIn) {
      return(<Homepage 
        dashboardMessage={this.state.dashboardMessage} 
        numBusPasses={this.state.numBusPasses} 
        numUtilities={this.state.numUtilities} 
        numFoodBags={this.state.numFoodBags} 
        addFoodBag={this.addFoodBag} 
        allEntries={this.state.entries}
        editEntry={this.editEntry}
        startEditing={this.startEditing}
        redirect={this.redirect}
        logOut={this.logOut}
        fetchServices={this.fetchServices}/>);
    }
    else if(this.state.page === "form" && this.state.loggedIn) {
      return(<Form 
        addEntry={this.addEntry} 
        editEntry={this.editEntry}
        deleteEntry={this.deleteEntry} 
        entries={this.state.entries} 
        entry={this.state.editingEntry} 
        redirect={this.redirect}
        clearEditingEntry={this.clearEditingEntry}/>);
    }
    else {
      return(<LoginPage 
        fetchServices={this.fetchServices}
        redirect={this.redirect}
        logIn={this.logIn}
        setUserName={this.setUserName}/>)
    }

  }
}

class LoginPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      username: "",
      password: "",
      wrongLogin: ""
    }
    this.fillUsername = this.fillUsername.bind(this);
    this.fillPassword = this.fillPassword.bind(this);
    this.verifyLogin = this.verifyLogin.bind(this);
    this.clearLogin = this.clearLogin.bind(this);
  }

  componentDidMount() {
    window.scroll(0,0);
  }

  verifyLogin() {
    const {username, password} = this.state;
    if(!username || !password) {
      this.setState({
        wrongLogin: "Please enter username and password."
      })
    }

    fetch("https://api.rccgoodsamaritan.org/apiProxy.php?endpoint=verifyUser.php", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({email: username, password: password})
    })
    .then(response => {
      if(!response.ok) {
        throw Error("Network response was not ok");
      }
      return response.json();
    })
    .then(data => {

      if(data.success) {
        this.props.setUserName(data.firstName);
        localStorage.setItem("userName", data.firstName);

        this.props.fetchServices().then(() => {
          this.props.logIn();
          this.props.redirect("home");
          this.clearLogin();
        });
      }
      else {
        this.setState({
          wrongLogin: "Wrong username or password."
        });
      }
    })
    .catch(error => {
      console.error("Error validating login");
      this.setState({
        wrongLogin: "An error occurred. Please try again."
      })
    }) 

    // if(this.state.username === "" && this.state.password === "") {
    //   this.props.fetchServices().then(() => {
    //     this.props.logIn();
    //     this.props.redirect("home");
    //     this.clearLogin();
    //   }).catch(error => {
    //     console.error("Error fetching services before login: " + error);
    //   });   
    // }
    // else {
    //   this.setState({
    //     wrongLogin: "Username or password is incorrect."
    //   })
    // }
  }

  fillUsername(e) {
    this.setState({
      username: e.target.value
    })
  }

  fillPassword(e) {
    this.setState({
      password: e.target.value
    })
  }

  clearLogin() {
    this.setState({
      wrongLogin: "",
      username: "",
      password: ""
    })
  }

  render() {
    return(
      <div id="login-background">
        <div className="logo-title-div">
          <img src="/rcc-logo.png" className="rcc-logo" />
          <span className="site-title">Good Samaritan</span>
        </div>
        <div id="login-container">
          <h3 id="login-title">Log In</h3>
          <div className="login-input-div">
            <label htmlFor="username" className="login-label">Email:</label>
            <input id="username" className="login-input" value={this.state.username} onChange={this.fillUsername}/>
          </div>
          <div className="login-input-div">
            <label htmlFor="username" className="login-label">Password:</label>
            <input type="password" id="password" className="login-input" value={this.state.password} onChange={this.fillPassword}/>
          </div>
          <button id="login-button" onClick={this.verifyLogin}>Login</button>
          <p id="wrong-login">{this.state.wrongLogin}</p>
        </div>
      </div>
    )
  }
}

const Entry = ({entry, onEdit}) => {
  return (
  <div className="entry-div" onClick={() => onEdit(entry)}>
      <div id="row-1">
        <span className="entry-field" id="date-field"><strong>Date: </strong>{entry.date}</span>
        <span className="entry-field" id="name-field"><strong>Name: </strong>{entry.name}</span>
        <span className="entry-field" id="service-field"><strong>Service: </strong>{entry.service}</span>
        <span className="entry-field" id="foodBag-field"><strong>Food Bag: </strong>{entry.foodBag === "0" ? "No " : "Yes"}</span>
      </div>
      <div id="notes-field"><strong>Notes: </strong>{entry.notes}</div>
    </div>
  )
}

const EntryList = ({entries, sort, onEdit}) => {
  const groupedEntries = groupEntries(entries, sort);
  //console.log(entries);
  return (
    <div className="entry-list">
      {Object.keys(groupedEntries).length > 0 ? 
        (Object.keys(groupedEntries).map((group, index) => (
          <div key={index} className="entry-group">
            <div className="sticky-header">{group}</div>
            {groupedEntries[group].map((entry, i) => (
              <Entry key={i} entry={entry} onEdit={onEdit}/>
            ))}
          </div>
        ))
      ) : (
        <p id="no-entries">No entries found.</p>
      )}
    </div>
  );
}

const groupEntries = (entries, sortMethod) => {
  return entries.reduce((acc, entry) => {
    let groupKey;

    if(sortMethod === "newest-to-oldest" || sortMethod === "oldest-to-newest") {
      groupKey =  new Date(entry.date).toLocaleString("default", {month: "long", year: "numeric"});
    }
    else if(sortMethod === "name-az" || sortMethod === "name-za"){
      groupKey = entry.name[0].toUpperCase();
    }
    
    if(!acc[groupKey]) {
      acc[groupKey] = [];
    }

    acc[groupKey].push(entry);

    return acc;
  }, {});
}

class Homepage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      returnedEntries: [],
      refinePanelVisible: false, 
      sort: "newest-to-oldest", 
      confirmedSort: "newest-to-oldest",
      filters: []
    }
    this.searchEntries = this.searchEntries.bind(this);
    this.showRefinePanel = this.showRefinePanel.bind(this);
    this.refineResults = this.refineResults.bind(this);
    this.cancelRefine = this.cancelRefine.bind(this);
    this.addFilter = this.addFilter.bind(this);
    this.removeFilter = this.removeFilter.bind(this);
    this.setSortMethod = this.setSortMethod.bind(this);
    this.setConfirmedSortMethod = this.setConfirmedSortMethod.bind(this);
    this.clearRefine = this.clearRefine.bind(this);
  }
  componentDidMount() {
    window.scroll(0,0);
  }

  componentDidUpdate(prevProps, prevState) {
    if(this.props.entries !== prevProps.entries) {
      console.log("entries updated");
    }
  }

  searchEntries(e) {
    const input = e.target.value;
    let results = [];

    for(let i = 0; i < this.props.allEntries.length; i++) {
      if(this.props.allEntries[i].name.toLowerCase().includes(input.toLowerCase())) {
        results = [...results, this.props.allEntries[i]];
      }
    }
    
    this.setState({
      returnedEntries: results
    })
  }

  componentDidUpdate(prevProps, prevState) {
  }

  refineResults(results) {
    this.setState({
      returnedEntries: results
    })
  }

  addFilter(selectedFilter) {
    this.setState((prevState) => ({
      filters: [...prevState.filters, selectedFilter]
    }))
  }

  removeFilter(selectedFilter) {
    this.setState((prevState) => ({
      filters: prevState.filters.filter((f) => f.name !== selectedFilter.name)
    }))
  }

  setSortMethod(sortMethod) {
    this.setState({
      sort: sortMethod
    })
  }

  setConfirmedSortMethod(sortMethod) {
    this.setState({
      confirmedSort: sortMethod
    })
  }

  clearRefine() {
    this.setSortMethod("newest-to-oldest");
    this.setState({
      filters: []
    })
  }

  showRefinePanel() {
    this.setState({
      refinePanelVisible: true
    })
  }

  cancelRefine() {
    this.setState({
      refinePanelVisible: false
    })
  }


  render() {
    return (
      <div id="homepage-div">
        {this.state.refinePanelVisible ? (<RefineResults 
        cancelRefine={this.cancelRefine} 
        entries={this.props.allEntries} 
        refineResults={this.refineResults} 
        filters={this.state.filters} 
        sort={this.state.sort} 
        addFilter={this.addFilter} 
        removeFilter={this.removeFilter} 
        setSortMethod={this.setSortMethod} 
        setConfirmedSortMethod={this.setConfirmedSortMethod}
        clearRefine={this.clearRefine}/>) 
        : (<div></div>)}
        <TopBar redirect={this.props.redirect} logOut={this.props.logOut}/>
        <h2 id="dashboard-message">{this.props.dashboardMessage}</h2>
        <div id="stats-div">
          <Stat name="Bus Passes" number={this.props.numBusPasses} nameId="bp-name" numberId="bp-number"/>
          <Stat name="Utility Assists" number={this.props.numUtilities} nameId="ua-name" numberId="ua-number"/>
          <Stat name="Will Be Fed Bags" number={this.props.numFoodBags} nameId="wbf-name" numberId="wbf-number"/>
        </div>
        <div id="homepage-btn-div">
          <button className="homepage-btn" onClick={() => this.props.redirect("form")}>Log Service</button>
          <button className="homepage-btn" onClick={this.props.addFoodBag}>Log Food Bag Only</button>
        </div>
        <div id="search-div">
          <input id="search-bar" placeholder="Search entries by name..." onChange={this.searchEntries}/>
          <button id="refine-btn" onClick={this.showRefinePanel} >Sort/Filter</button>
        </div>
        <EntryList entries={this.state.filters.length === 0 ? this.props.allEntries : this.state.returnedEntries} sort={this.state.confirmedSort} onEdit={(entry) => this.props.startEditing(entry)} />
        {/* <button id="upload-btn">Upload Entries</button> */}
        {/* <label htmlFor="choose-file" id="choose-file-label">Import Entries</label>
        <input type="file" id="choose-file"/> */}
      </div>
    )
  }
}

class RefineResults extends React.Component {
  constructor(props) {
    super(props);
    this.addOrRemoveFilter = this.addOrRemoveFilter.bind(this);
    this.handleSelect = this.handleSelect.bind(this);
    this.cancelRefine = this.cancelRefine.bind(this);
    this.filterResults = this.filterResults.bind(this);
    this.sortResults = this.sortResults.bind(this);
    this.handleApply = this.handleApply.bind(this);
  }
  
  static defaultProps = {
    months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    services: ["Bus Pass", "Utility", "Gas Card", "Other"],
    foodBag: ["Yes", "No"],
  };

  componentDidUpdate(prevProps, prevState) {
    if(prevProps.filters !== this.props.filters) {
    }
  }

  addOrRemoveFilter(e) {
    let isFilterSelected = false;
    const filters = this.props.filters;
    const buttonPressed = e.target;

    if(filters.length > 0) {
      for(let i = 0; i < filters.length; i++) {
        if(buttonPressed.value === filters[i].name) {
          isFilterSelected = true;
        }
      }

      if(isFilterSelected) {
        this.props.removeFilter({name: buttonPressed.value, type: buttonPressed.className});
      }
      else {
        this.props.addFilter({name: buttonPressed.value, type:buttonPressed.className});
      }
    }
    else {
      this.props.addFilter({name: buttonPressed.value, type: buttonPressed.className});
    }
    
  }

  filterResults(entries) {
    let results = [];
    const filters = this.props.filters;
    //const entries = this.props.entries;
    const groupedFilters = filters.reduce((acc, filter) => {
      if(!acc[filter.type]) {
        acc[filter.type] = [];
      }
      acc[filter.type].push(filter.name);
      return acc;
    }, {});

    for(let i = 0; i < entries.length; i++) {
      let matchesFilters = true;
      for(const [filterType, filterValues] of Object.entries(groupedFilters)) {
        if(filterType.includes("month-btn")) {
          const entryMonth = this.props.months[new Date(entries[i].date).getMonth()];
          if(!filterValues.includes(entryMonth)) {
            matchesFilters = false;
            break;
          }
        }
        else if(filterType.includes("service-btn")) {
          if(!filterValues.includes(entries[i].service)) {
            matchesFilters = false;
            break;
          }
        }
        else if(filterType.includes("foodBag-btn")) {
          const hasFoodBag = entries[i].foodBag === "1" ? "Yes" : "No";
          if(!filterValues.includes(hasFoodBag)) {
            matchesFilters = false;
            break;
          }
        }
      }
      if(matchesFilters) {
        results.push(entries[i]);
      }
    }
    return(results);
  }

  sortResults(entries) {
    const sortMethod = this.props.sort;
    let results = [];
    if(sortMethod === "newest-to-oldest") {
      results = entries.sort((a, b) => new Date(b.date) - new Date(a.date));
    }
    else if(sortMethod === "oldest-to-newest") {
      results = entries.sort((a, b) => new Date(a.date) - new Date(b.date));
    }
    else if(sortMethod === "name-az") {
      results = entries.sort((a, b) => a.name.localeCompare(b.name));
    }
    else if(sortMethod === "name-za") {
      results = entries.sort((a, b) => b.name.localeCompare(a.name));
    }
    return(results);
  }

  cancelRefine() {
    this.props.cancelRefine();
  }

  handleSelect(e) {
    this.props.setSortMethod(e.target.value);
  }

  handleApply() {
    let entries = this.props.entries;
    entries = this.filterResults(entries);
    entries = this.sortResults(entries);
    this.props.setConfirmedSortMethod(this.props.sort);
    this.props.refineResults(entries);
    this.cancelRefine();
  }

  render() {
    return (
      <div id="refine-background">
        <div id="refine-panel">
          <div id="sort-filter-div">
            <div id="sort-div">
              <h3 id="sort-title">Sort</h3>
              <select id="sort-select" onChange={this.handleSelect} value={this.props.sort}>
                <option value="newest-to-oldest">Date Newest-Oldest</option>
                <option value="oldest-to-newest">Date Oldest-Newest</option>
                <option value="name-az">Name A-Z</option>
                <option value="name-za">Name Z-A</option>
              </select>
            </div>
            <div id="filter-div">
              <h3 id="filter-title">Filter</h3>
              <div id="month-filter-div">
                <p id="month-p">Month</p>
                <div id="month-btn-div">
                  <RefineButtons buttons={this.props.months} name="month-btn" handleClick={this.addOrRemoveFilter} selectedFilters={this.props.filters}/>
                </div>
              </div>
              <div id="service-filter-div">
                <p id="service-p">Service</p>
                <div id="service-btn-div">
                  <RefineButtons buttons={this.props.services} name="service-btn" handleClick={this.addOrRemoveFilter} selectedFilters={this.props.filters}/>
                </div>
              </div>
              <div id="foodBag-filter-div">
                <p id="foodBag-p">Food Bag</p>
                <div id="foodBag-btn-div">
                  <RefineButtons buttons={this.props.foodBag} name="foodBag-btn" handleClick={this.addOrRemoveFilter} selectedFilters={this.props.filters}/>
                </div>
              </div>
            </div>
          </div>
          <div id="apply-cancel-btns">
            <button id="apply-filter-btn" onClick={this.handleApply}>Apply</button>
            <button id="cancel-filter-btn" onClick={this.cancelRefine}>Cancel</button>
          </div>
          <button id="clear-criteria-btn" onClick={this.props.clearRefine}>Clear Search Criteria</button>
        </div>
      </div>
    )
  }
}

const RefineButtons = ({buttons, name, handleClick, selectedFilters}) => {
  return (
    <div>
      {buttons.map((button, index) => {
        const isSelected = selectedFilters.some(filter => filter.name === button);
        return (
          <button
            className={`${name} ${isSelected ? "selected-filter" : ""}`}
            onClick={handleClick}
            value={button}
            key={index}
          >{button}</button>
        );
      })}
    </div>
  )
}


class Stat extends React.Component {
  render() {
    return (
      <div className="stat-div">
        <div className="stat-number" id={this.props.numberId}>{this.props.number}</div>
        <div className="stat-name" id={this.props.nameId}>{this.props.name}</div>
      </div>
    )
  }
}

class TopBar extends React.Component {
  
  render() {
    return (
      <div id="bar">
        <div className="logo-title-div">
          <img src="/rcc-logo.png" className="rcc-logo"/>
          <span className="site-title">Good Samaritan</span>
        </div>
        <span id="logout-btn" onClick={() => {
          this.props.redirect("login");
          this.props.logOut()}}>Logout</span>
      </div>
    )
  }
}
  

class Form extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      id: props.entry?.id || Date.now(),
      date: props.entry?.date || "",
      name: props.entry?.name || "",
      service: props.entry?.service || "Bus Pass",
      notes: props.entry?.notes || "",
      foodBag: props.entry?.foodBag === true || props.entry?.foodBag === "1" ? true : false,
      eligibleWarning: "",
      blankFieldWarning: "",
      deleteMessage: props.entry ? "Delete Entry" : "",
      confirmationVisible: false
    }
    this.handleChange = this.handleChange.bind(this);
    this.submitEntry = this.submitEntry.bind(this);
    this.clearForm = this.clearForm.bind(this);
    this.cancelEntry = this.cancelEntry.bind(this);
    this.checkEligibility = this.checkEligibility.bind(this);
    this.showConfirmation = this.showConfirmation.bind(this);
    this.hideConfirmation = this.hideConfirmation.bind(this);
    this.deleteEntry = this.deleteEntry.bind(this);
  }

  componentDidMount() {
      window.scroll(0,0);
  }

  componentDidUpdate(prevProps, prevState) {
    if(prevState.name !== this.state.name || prevState.date !== this.state.date || prevState.service !== this.state.service) {
      this.checkEligibility(this.state.name, this.state.date, this.state.service);
    }
  }

  handleChange(e) {
    const {name, type, checked, value} = e.target;
    this.setState({
      [name]: type === "checkbox" ? checked : value
    })
  }

  checkEligibility(name, date, service) {
    const inputDateMonth = new Date(date).getMonth();
    const inputDateYear = new Date(date).getFullYear();

    for(let i = 0; i < this.props.entries.length; i++) {
      const entryMonth = new Date(this.props.entries[i].date).getMonth();
      const entryYear = new Date(this.props.entries[i].date).getFullYear();
      if(service === "Bus Pass"){
        if(inputDateMonth === entryMonth && inputDateYear === entryYear && name.toLowerCase() === this.props.entries[i].name.toLowerCase() && service === this.props.entries[i].service) {
          this.setState({
            eligibleWarning: "Warning: This person has already received a bus pass this month."
          })
          return;
        }
        else {
          this.setState({
            eligibleWarning: ""
          })
        }
      }
      else if(service === "Utility") {
        if(inputDateYear === entryYear && name.toLowerCase() === this.props.entries[i].name.toLowerCase() && service === this.props.entries[i].service) {
          this.setState({
            eligibleWarning: "Warning: This person has already received utility assistance this year."
          })
          return;
        }
        else {
          this.setState({
            eligibleWarning: ""
          })
        }
      }
      else {
        this.setState({eligibleWarning: ""});
      }
      
    }
  }

  clearForm() {
    this.setState({
      date: "",
      name: "",
      service: "Bus Pass",
      notes: "",
      foodBag: false,
      blankFieldWarning: "",
      eligibleWarning: ""
    })
  }

  submitEntry(e) {
    e.preventDefault();

    const {id, date, name, service, notes, foodBag} = this.state;
    const entry = {id, date, name, service, notes, foodBag};

    if(!this.state.name || !this.state.date){
      this.setState({
        blankFieldWarning: "Please fill all required fields."
      })
      return;
    }

    if(this.props.entry) {
      this.props.editEntry({...this.props.entry, ...entry})
    }
    else {
      this.props.addEntry(entry);
    }

    this.clearForm();
    this.props.redirect("home");

  }

  deleteEntry() {
    this.props.deleteEntry(this.state.id);
  }

  cancelEntry(e) {
    e.preventDefault();
    this.clearForm();
    this.props.clearEditingEntry();
    this.props.redirect("home");
  }

  showConfirmation() {
    this.setState({
      confirmationVisible: true
    })
  }

  hideConfirmation() {
    this.setState({
      confirmationVisible: false
    })
  }

  render() {
    return (
      <div id="form-background">
        {this.state.confirmationVisible ? <DeleteConfirmation redirect={this.props.redirect} deleteEntry={this.deleteEntry} hideConfirmation={this.hideConfirmation}/> : <div></div>}
        <form id="new-entry-form">
          <h2 id="form-header">{this.props.entry ? "Update Entry" : "Add New Entry"}</h2>
          <div id="date-form-div" className="form-field">
            <label htmlFor="date-input" className="form-field-title">Date*</label>
            <input name="date" type="date" id="date-input" className="form-input" onChange={this.handleChange} value={this.state.date} />
          </div>
          <div id="name-form-div" className="form-field">
            <label htmlFor="name-input" className="form-field-title">Name*</label>
            <input name="name" id="name-input" className="form-input" onChange={this.handleChange} value={this.state.name} />
          </div>
          <div id="service-form-div" className="form-field">
            <label htmlFor="service-input" className="form-field-title">Service*</label> 
            <select name="service" id="service-input" className="form-input" onChange={this.handleChange} value={this.state.service}>
              <option value="Bus Pass">Bus Pass</option>
              <option value="Utility">Utility</option>
              <option value="Gas Card">Gas Card</option>
              <option value="Other">Other</option>
            </select>
            <p id="warning-message">{this.state.eligibleWarning}</p>
          </div>
          <div id="notes-form-div" className="form-field">
            <label htmlFor="notes-input" className="form-field-title">Notes</label> 
            <textarea name="notes" id="notes-input" className="form-input" placeholder="Eligibility, utility assistance amount, etc" onChange={this.handleChange} value={this.state.notes}></textarea>
          </div>
          <div id="wbf-bag-div" className="form-field">
            <input name="foodBag" id="wbf-checkbox" type="checkbox" onChange={this.handleChange} value={this.state.foodBag} checked={this.state.foodBag} />
            <label name="foodBag" htmlFor="wbf-checkbox" class="custom-checkbox"></label>
            <span class="form-field-title">  Include Will Be Fed bag</span>
          </div>
          <div id="form-btn-div">
            <button id="btn-submit" className="form-btn" type="submit" onClick={this.submitEntry}>{this.props.entry ? "Update" : "Submit"}</button>
            <button id="btn-cancel" className="form-btn" onClick={this.cancelEntry}>Cancel</button>
          </div>
          <p id="blank-field-warning">{this.state.blankFieldWarning}</p>
          <p id="delete-entry" onClick={this.showConfirmation}>{this.state.deleteMessage}</p>
        </form>
      </div>
    )
  }
}

const DeleteConfirmation = ({redirect, deleteEntry, hideConfirmation}) => {
  return(
    <div id="confirmation-background">
      <div id="confirmation-container">
        <p id="confirmation-prompt">Are you sure you want to delete this entry?</p>
        <div id="confirmation-buttons">
          <button className="confirmation-btn" onClick={() => {
            redirect("home");
            deleteEntry();
          }}>Yes</button>
          <button className="confirmation-btn" onClick={hideConfirmation}>No</button>
        </div>
      </div>
    </div>
  )
}

  ReactDOM.render(<App />, document.getElementById("root"));