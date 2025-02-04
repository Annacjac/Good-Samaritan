//import React from 'react';
//import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

class App extends React.Component {
  constructor(props) {
    super(props);
    //localStorage.clear();
    const savedEntries = localStorage.getItem("entries");
    const savedBusPasses = localStorage.getItem("busPasses");
    const savedUtilityAssistance = localStorage.getItem("utilityAssistance");
    const savedFoodBags = localStorage.getItem("foodBags");
    const savedLoggedIn = localStorage.getItem("loggedIn");
    this.state = {
      entries: savedEntries ? JSON.parse(savedEntries) : [],
      page: window.location.hash.replace("#", "") || "login",
      numBusPasses: savedBusPasses ? JSON.parse(savedBusPasses) : 0,
      numUtilities: savedUtilityAssistance ? JSON.parse(savedUtilityAssistance) : 0,
      numFoodBags: savedFoodBags ? JSON.parse(savedFoodBags) : 0,
      dashboardMessage: "",
      userName: "Anna",
      loggedIn: savedLoggedIn ? JSON.parse(savedLoggedIn) : false,
      editingEntry: null
    };
    this.logIn = this.logIn.bind(this);
    this.logOut = this.logOut.bind(this);
    this.addEntry = this.addEntry.bind(this);
    this.editEntry = this.editEntry.bind(this);
    this.deleteEntry = this.deleteEntry.bind(this);
    this.startEditing = this.startEditing.bind(this);
    this.addFoodBag = this.addFoodBag.bind(this);
    this.sortEntries = this.sortEntries.bind(this); 
    this.redirect = this.redirect.bind(this);
  }

  componentDidMount() {
    if(!window.location.hash) {
      window.location.hash = "#login";
    }

    window.addEventListener("hashchange", () => {
      this.setState({ page: window.location.hash.replace("#", "") });
    });

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

  componentDidUpdate(prevProps, prevState) {
    console.log("change");
  }

  redirect(toPage) {
    this.setState({
      page: toPage
    })
  }

  logIn() {
    this.setState(
      { loggedIn: true },
      () => {
        localStorage.setItem("loggedIn", JSON.stringify(this.state.loggedIn));
      }
    );
  }

  logOut() {
    this.setState(
      { loggedIn: false },
      () => {
        localStorage.setItem("loggedIn", JSON.stringify(this.state.loggedIn));
      }
    );
  }

  

  addEntry(entryState) {
    this.setState((prevState) => ({
      entries: [entryState, ...prevState.entries],
      numBusPasses: entryState.service === "Bus Pass" ? prevState.numBusPasses + 1 : prevState.numBusPasses,
      numUtilities: entryState.service === "Utility Assistance" ? prevState.numUtilities + 1 : prevState.numUtilities,
      numFoodBags: entryState.foodBag ? prevState.numFoodBags + 1 : prevState.numFoodBags,
    }), () => {
      localStorage.setItem("entries", JSON.stringify(this.state.entries));
      localStorage.setItem("busPasses", JSON.stringify(this.state.numBusPasses));
      localStorage.setItem("utilityAssistance", JSON.stringify(this.state.numUtilities));
      localStorage.setItem("foodBags", JSON.stringify(this.state.numFoodBags));
    });

    this.sortEntries();
  }

  editEntry(updatedEntry) {
    const originalEntry = this.state.entries.find((entry) => entry.id === updatedEntry.id);

    this.setState((prevState) => ({
      entries: prevState.entries.map((entry) => 
        entry.id === updatedEntry.id ? updatedEntry : entry
      ),
      numBusPasses: updatedEntry.service === "Bus Pass" && originalEntry.service !== "Bus Pass" ? prevState.numBusPasses + 1 : originalEntry.service === "Bus Pass" && updatedEntry.service !== "Bus Pass" ? prevState.numBusPasses - 1 : prevState.numBusPasses,
      numUtilities: updatedEntry.service === "Utility Assistance" && originalEntry.service !== "Utility Assistance" ? prevState.numUtilities + 1  : originalEntry.service === "Utility Assistance" && updatedEntry.service !== "Utility Assistance" ? prevState.numUtilities - 1 : prevState.numUtilities,
      numFoodBags: updatedEntry.foodBag && !originalEntry.foodBag ? prevState.numFoodBags + 1 : originalEntry.foodBag && !updatedEntry.foodBag ? prevState.numFoodBags - 1 : prevState.numFoodBags,
      editingEntry: null,
    }), () => {
      localStorage.setItem("entries", JSON.stringify(this.state.entries));
      localStorage.setItem("busPasses", JSON.stringify(this.state.numBusPasses));
      localStorage.setItem("utilityAssistance", JSON.stringify(this.state.numUtilities));
      localStorage.setItem("foodBags", JSON.stringify(this.state.numFoodBags));
    })
    
  }

  deleteEntry(deletedEntryId) {
    const deletedEntry = this.state.entries.find((entry) => entry.id === deletedEntryId);
    
    this.setState((prevState) => ({
      entries: prevState.entries.filter((entry) => entry.id !== deletedEntryId),
      numBusPasses: deletedEntry.service === "Bus Pass" ? prevState.numBusPasses - 1 : prevState.numBusPasses,
      numUtilities: deletedEntry.service === "Utility Assistance" ? prevState.numUtilities - 1 : prevState.numUtilities,
      numFoodBags: deletedEntry.foodBag ? prevState.numFoodBags - 1 : prevState.numFoodBags
    }), () => {
      localStorage.setItem("entries", JSON.stringify(this.state.entries));
      localStorage.setItem("busPasses", JSON.stringify(this.state.numBusPasses));
      localStorage.setItem("utilityAssistance", JSON.stringify(this.state.numUtilities));
      localStorage.setItem("foodBags", JSON.stringify(this.state.numFoodBags));
    })
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

  addFoodBag() {
    this.setState(prevState => ({
      numFoodBags: prevState.numFoodBags + 1
    }), () => {
      localStorage.setItem("foodBags", JSON.stringify(this.state.numFoodBags));
    })
  }

  createDashboardMessage() {
    const currentHour = new Date.getHours();
    return currentHour;
  }

  render() {
    if(this.state.page === "home" && this.state.loggedIn) {
      return(<Homepage 
        dashboardMessage={this.state.dashboardMessage} 
        numBusPasses={this.state.numBusPasses} 
        numUtilities={this.state.numUtilities} 
        numFoodBags={this.state.numFoodBags} 
        addFoodBag={this.addFoodBag} 
        entries={this.state.entries}
        editEntry={this.editEntry}
        startEditing={this.startEditing}
        redirect={this.redirect}
        logOut={this.logOut}/>);
    }
    else if(this.state.page === "form" && this.state.loggedIn) {
      return(<Form 
        addEntry={this.addEntry} 
        editEntry={this.editEntry}
        deleteEntry={this.deleteEntry} 
        entries={this.state.entries} 
        entry={this.state.editingEntry} 
        redirect={this.redirect}/>);
    }
    else {
      return(<LoginPage 
        redirect={this.redirect}
        logIn={this.logIn}/>)
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

  verifyLogin() {
    if(this.state.username === "ridgleaChristian" && this.state.password === "Ridglea6720!") {
      this.props.logIn();
      this.props.redirect("home");
      this.clearLogin();
    }
    else {
      this.setState({
        wrongLogin: "Username or password is incorrect."
      })
    }
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
            <label for="username" className="login-label">Username:</label>
            <input id="username" className="login-input" value={this.state.username} onChange={this.fillUsername}/>
          </div>
          <div className="login-input-div">
            <label for="username" className="login-label">Password:</label>
            <input type="password" id="username" className="login-input" value={this.state.password} onChange={this.fillPassword}/>
          </div>
          <p id="wrong-login">{this.state.wrongLogin}</p>
          <button id="login-button" onClick={this.verifyLogin}>Login</button>
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
        <span className="entry-field" id="foodBag-field"><strong>Food Bag: </strong>{entry.foodBag ? "Yes" : "No "}</span>
      </div>
      <div id="notes-field"><strong>Notes: </strong>{entry.notes}</div>
    </div>
  )
}

const EntryList = ({entries, sort, onEdit}) => {
  const groupedEntries = groupEntries(entries, sort);

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
      returnedEntries: this.props.entries,
      allEntries: this.props.entries,
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

  searchEntries(e) {
    const input = e.target.value;
    let results = [];

    for(let i = 0; i < this.state.allEntries.length; i++) {
      if(this.state.allEntries[i].name.toLowerCase().includes(input.toLowerCase())) {
        results = [...results, this.state.allEntries[i]];
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
        entries={this.state.allEntries} 
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
        <EntryList entries={this.state.returnedEntries} sort={this.state.confirmedSort} onEdit={(entry) => this.props.startEditing(entry)} />
        {/* <button id="upload-btn">Upload Entries</button> */}
        {/* <label for="choose-file" id="choose-file-label">Import Entries</label>
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
    services: ["Bus Pass", "Utility Assistance", "Gas Card", "Other"],
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
          const hasFoodBag = entries[i].foodBag ? "Yes" : "No";
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
      foodBag: props.entry?.foodBag || false,
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
      else if(service === "Utility Assistance") {
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
      foodBag: "false",
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
            <label for="date-input" className="form-field-title">Date*</label>
            <input name="date" type="date" id="date-input" className="form-input" onChange={this.handleChange} value={this.state.date} />
          </div>
          <div id="name-form-div" className="form-field">
            <label for="name-input" className="form-field-title">Name*</label>
            <input name="name" id="name-input" className="form-input" onChange={this.handleChange} value={this.state.name} />
          </div>
          <div id="service-form-div" className="form-field">
            <label for="service-input" className="form-field-title">Service*</label> 
            <select name="service" id="service-input" className="form-input" onChange={this.handleChange} value={this.state.service}>
              <option value="Bus Pass">Bus Pass</option>
              <option value="Utility Assistance">Utility Assistance</option>
              <option value="Gas Card">Gas Card</option>
              <option value="Other">Other</option>
            </select>
            <p id="warning-message">{this.state.eligibleWarning}</p>
          </div>
          <div id="notes-form-div" className="form-field">
            <label for="notes-input" className="form-field-title">Notes</label> 
            <textarea name="notes" id="notes-input" className="form-input" placeholder="Eligibility, utility assistance amount, etc" onChange={this.handleChange} value={this.state.notes}></textarea>
          </div>
          <div id="wbf-bag-div" className="form-field">
            <input name="foodBag" id="wbf-checkbox" type="checkbox" onChange={this.handleChange} value={this.state.foodBag} checked={this.state.foodBag} />
            <label name="foodBag" for="wbf-checkbox" class="custom-checkbox"></label>
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