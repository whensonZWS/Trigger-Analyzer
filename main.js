
// global variables
var container = document.getElementById('mynetwork');
var focusOptions = {
    scale: 1,
    offset: {x: 0, y: 0},
    animation: {duration: 1000,easingFunction: "easeInOutQuad"},
};

var networkData = {
    nodes: [
        {id:0,  label:"Load a Red Alert 2 map file",  shape:"box"},
        {id:1,  label:"to see the triggers!",         shape:"box"}
    ],
    edges: [
        {from:0,to:1,arrows:"to",length:250}
    ]
};

var networkOptions = {
    interaction: {
        navigationButtons: true,
        keyboard: true
    },
    physics: {
        barnesHut: {
            springConstant: 0.05,
            centralGravity: 0.4
        }
    },
    edges:{
        width: 3,
        selectionWidth: w => w*2,
        length: 100
    }
};

// simple init
//var nodesView = new vis.DataView(networkData);
var network = new vis.Network(container, networkData, networkOptions);

// global options for filters
var nodeFilterValue = '';
const nodesFilter = (node) => {
    if(nodeFilterValue == ''){
        return true;
    }
    switch(nodeFilterValue){
        case 'triggers':
            return node.house != undefined;
        case 'variables':
            return node.house == undefined;
        default:
            return true;
    }
};
var nfs = document.getElementById("nodeFilterSelect");
nfs.addEventListener("change", (e) => {
    nodeFilterValue = e.target.value;
    nodesView.refresh();
});

// global physics
var pc = document.getElementById("physicsCheck");
pc.addEventListener("change", (e) =>{
    network.setOptions({physics:{enabled:e.target.checked}});
});
var sb = document.getElementById('stopBtn');
sb.addEventListener("click",(e)=>{
    network.stopSimulation();
});
var tree = document.getElementById('treeLayout');
tree.addEventListener('change',(e)=>{
    network.setOptions({
        layout:{
            hierarchical:{
                enabled:e.target.checked,
                direction: 'UD',
                sortMethod: 'hubsize',  // hubsize, directed
            }
        },
        physics:{
            hierarchicalRepulsion: {
                avoidOverlap: 0.5
            }
        }
    });
    network.fit();

});


//async load final alert events/actions data
var fadata = new XMLHttpRequest();

fadata.onreadystatechange = function () {
    if (this.readyState == 4 && this.status == 200) {
        fadata = JSON.parse(fadata.responseText);
        events = fadata.events;
        actions = fadata.actions;
    }
};
fadata.open('GET','./fadata.json',true);
fadata.send();
var events = [];
var actions = [];




//on load initialization
window.onload = function() {
    document.getElementById('searchBox').value = '';
    var fileInput = document.getElementById('fileInput');

    fileInput.addEventListener('change', function(e) {
        var file = fileInput.files[0];
        //var textType = /text.*/;
        //if (file.type.match(textType)) {
        var reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('searchBox').value = '';
            network.destroy();
            var info = document.getElementById('info');
            info.innerHTML = 'File detected, attempting to load...';
            try{
                raw = parseText(e.target.result);
                try{
                    generateNetwork(raw);
                }catch(error){
                    alert('Unable to generate network graph!');
                    console.log(error);
                    info.innerHTML = 'File loading failed.';
                }
            }catch(error){
                alert('Map file parse Error!');
                console.log(error);
                info.innerHTML = 'File loading failed.';
            }                     
        }
        reader.readAsText(file, 'UTF-8');
        reader.onerror = error=>console.log(error);
	});
}



// search filter function
function searchFilterFunc(){
    var input = document.getElementById('searchBox');
    var filter = input.value.toLowerCase();
    var info = document.getElementById('info');
    
    var nl = document.getElementById('nodesList')
    nl = nl.getElementsByTagName('div');
    var info = document.getElementById('info');
    for(i=0;i<nl.length;i++){
        
        if((nl[i].innerHTML + nl[i].inner_id).toLowerCase().indexOf(filter)>-1){
            nl[i].style.display = "";
        }else{
            nl[i].style.display = "none";
        }
    }
    
}

// receive an object and populate information box
function displayInfo(raw){
    var info = document.getElementById('info');
    while(info.hasChildNodes()){
        info.removeChild(info.childNodes[0]);
    }
    // Triggers:
    if(raw.house){
        var d0 = document.createElement('div');
        d0.innerHTML = 
            `<div class='listItem'>Name:&nbsp;${raw.label}</div>
            <div class='listItem'>ID:&nbsp;${raw.id}</div>`;
        var btn1 = document.createElement('button');
        btn1.innerHTML = 'Basic Info:';
        btn1.className = 'collapsible active';
        var d1 = document.createElement('div');
        d1.className = 'content';
        // basic info
        const tags = raw.tags.join(',&nbsp')
        d1.innerHTML =  `
            <div class='listItem'>House: ${raw.house}</div> 
            <div class='listItem'>Repeat: ${raw.repeat}</div>
            <div class='listItem'>Tags:&nbsp;${tags} </div>`
        easy = raw.easy?'green':'red';
        normal = raw.normal?'green':'red';
        hard = raw.hard?'green':'red';
        disabled = raw.disabled?'red':'green';
        d1.innerHTML += `<div class='listItem'>Difficulty:&nbsp;<span class='${easy}'>Easy</span>&nbsp;&nbsp;<span class='${normal}'>Normal</span>&nbsp;&nbsp;<span class='${hard}'>Hard</span></div>`;
        d1.innerHTML += `<div class='listItem'>Disabled:&nbsp;<span class='${disabled}'>${raw.disabled?"True":"False"}</span></div>`;
        // events
        var btn2 = document.createElement('button');
        btn2.innerHTML = 'Events:';
        btn2.className = 'collapsible active';

        var d2 = document.createElement('div');
        d2.className = 'content';
        for(var i=0;i<raw.events.length;i++){
            var t = raw.events[i].type;
            var d = document.createElement('div');
            d.className = 'listItem';
            d.innerHTML += `Event ${i}: ${events[t].name}`;
            // check if the events type has more than 2 variables in
            if(events[t].p[0] > 0){
                d.innerHTML += ` ${raw.events[i].p[0]} ${raw.events[i].p[1]}`;
            }else{
                d.innerHTML += ` ${raw.events[i].p[0]}`
            }
            d2.appendChild(d);
        }

        //actions
        var btn3 = document.createElement('button');
        btn3.innerHTML = 'Actions:';
        btn3.className = 'collapsible active';
        var d3 = document.createElement('div');
        d3.className = 'content';
        for(var i=0;i<raw.actions.length;i++){
            var t = raw.actions[i].type;
            var d = document.createElement('div');
            d.innerHTML += `Action ${i}: ${actions[t].name}`;
            d.className = 'listItem';
            for(j=0;j<7;j++){
                if(actions[t].p[j]>0){
                    if(j!=6) d.innerHTML += ` ${raw.actions[i].p[j]}`;
                    else d.innerHTML += ` @${wp(raw.actions[i].p[j])}`;
                }
            }
            d3.appendChild(d);
        }
        info.appendChild(d0);
        info.appendChild(btn1);
        info.appendChild(d1);
        info.appendChild(btn2);
        info.appendChild(d2);
        info.appendChild(btn3);
        info.appendChild(d3);
        bind_coll();
    }else{
        info.innerHTML = 
            `Variable <br> 
            Name:&nbsp;${raw.label}<br>
            ID:&nbsp;${raw.id}<br>
            Initial Value:&nbsp;${raw.initValue}`;
    
    }
}

// receive nodes/edge object and generate network
function generateNetwork(raw) {

    var nodes = raw.nodes;
    var edges = raw.edges;
    const nodes_index = {};
    var L = document.getElementById('nodesList');
    L.innerHTML = '';
    for(var i=0;i<nodes.length;i++){
        nodes_index[nodes[i].id] = i;
    }
    //var nodes = new vis.DataSet(raw.nodes);
    //var edges = new vis.DataSet(raw.edges);
    nodesView = new vis.DataView(new vis.DataSet(nodes),{filter:nodesFilter});
    var data = {
        nodes: nodesView,
        edges: edges
    };  
    
    

    network = new vis.Network(container, data, networkOptions);            
    
    network.on("click", function (params) {
        if(params.nodes.length > 0){
            const n_id = params.nodes[0];
            //document.getElementById('info').innerText = JSON.stringify(nodes[nodes_index[n_id]],null,4);
            displayInfo(nodes[nodes_index[n_id]]);
        }
    });

    network.on("doubleClick", function (params) {
        if(params.nodes.length > 0){
            network.focus(params.nodes[0],focusOptions);
        }
    });

    var info = document.getElementById('info')
    network.on("stabilizationProgress", function (params) {
        info.innerText = "Loading: " + Math.round(params.iterations / params.total * 100) + '%\n';
        info.innerText += `Assets: \nTriggers & Variables: ${nodes.length} \nLinks: ${edges.length}`
        if(raw.warning.length > 0){
            info.innerHTML += `<br> <div class='yellow'> Warnings: (Check your map for potential error)</div>
                <div> ${parseWarning(raw.warning)} </div>`;
        }
    });
    network.once("stabilizationIterationsDone", function () {
        info.innerText = `100% Loaded. \nAssets: \nTriggers & Variables: ${nodes.length} \nLinks: ${edges.length} `;
        if(raw.warning.length>0){
            info.innerHTML += `
                <br> <div class='yellow'> Warnings: (Check your map for potential error) </div>
                <div> ${parseWarning(raw.warning)} </div>`;
        }
        var nl = document.getElementById('nodesList');
        for(var i=0;i<nodes.length;i++){
            var d = document.createElement('div');
            d.className = "listItem";
            d.title = "id: " + nodes[i].id;
            d.inner_id = nodes[i].id;
            d.innerHTML = nodes[i].label;
            d.addEventListener("click",function (e){
                network.focus(this.inner_id,focusOptions);
                network.setSelection({nodes:[this.inner_id]});
                displayInfo(nodes[nodes_index[this.inner_id]]);
            });
            nl.appendChild(d); 
        }
    });

};

/**
 * @param {[]} data, the arrays of warning message
 * @return {String} an HTML string representing the warning message
 * input should be an array consist of warning messange,
 * warning information can get complex in the future, where each array element contains type of error and the detailed information for each error
 * 
*/ 
function parseWarning(data){
    return data.join('<br>')
}

// code that I shamelessly copy from stack overflow
function parseINIString(data){
    var regex = {
        section: /^\s*\[\s*([^\]]*)\s*\]\s*$/,
        param: /^\s*([^=]+?)\s*=\s*(.*?)\s*$/,
        comment: /^\s*;.*$/
    };
    var value = {};
    var lines = data.split(/[\r\n]+/);
    var section = null;
    lines.forEach(function(line){
        if(regex.comment.test(line)){
            return;
        }else if(regex.param.test(line)){
            var match = line.match(regex.param);
            if(section){
                value[section][match[1]] = match[2];
            }else{
                value[match[1]] = match[2];
            }
        }else if(regex.section.test(line)){
            var match = line.match(regex.section);
            value[match[1]] = {};
            section = match[1];
        }else if(line.length == 0 && section){
            section = null;
        };
    });
    return value;
}


/**
 * 
 * @param {String} data, the INI text string to be parsed 
 * @returns {object} an object containing 3 arrays: nodes, edges and warnings
 */
function parseText(data){
    config = parseINIString(data);

    var nodes = [];
    var edges = [];
    var warning = [];
    var unique_id = new Set();

    /**
     * Relationship between Triggers and Tags is not well understood
     * Here triggers are grouped as disjoint sets, i.e. each trigger belong to only one set.
     * each set may have one or more tags associated with it
     * the repeating type of a trigger will be determined by the first tags associated with its set.
     */
    // pre-processing
    disjointTrigger = {};
    triggerRef = {};

    // initialize the disjoint set
    for(var item in config.Triggers){
        const arr = config.Triggers[item].split(',');
        if(arr[1] == '<none>'){
            disjointTrigger[item] = item;
        }else{
            disjointTrigger[item] = arr[1];
        }
        triggerRef[item] = [];
    }

    // update the triggers reference using the disjoint set
    for(var item in config.Tags){
        const arr = config.Tags[item].split(',');
        const rep = findRep(arr[2]);
        if(triggerRef[rep] == undefined){
            warning.push(`Tag ${item} refer to a none existing trigger!`);
        }else{
            triggerRef[rep].push(item);
        }
    }

    // read trigger now
    for(var item in config.Triggers){
        const arr = config.Triggers[item].split(',');
        var obj = {};

        // trigger property
        obj.id = item;
        obj.label = arr[2];
        obj.house = arr[0];             
        obj.easy = parseInt(arr[4]);
        obj.normal = parseInt(arr[5]);
        obj.hard = parseInt(arr[6]);
        obj.disabled = parseInt(arr[3]);

        // check if the trigger has any associated tags
        const rep = findRep(item);
        if(triggerRef[rep].length == 0){
            warning.push(`Trigger ${item} doesn't have any tags!`)
            continue;
        }
        // associated the repeating type with the first tag
        obj.tags = triggerRef[rep];
        obj.repeat = parseInt(config.Tags[obj.tags[0]].split(',')[0]);
        obj.link = arr[1];
        if(obj.link.trim() != '<none>'){
            edges.push({from: obj.id, to: obj.link, arrows: "to;from", color: '#FFA500'});
        }

        // parse objects and events
        try{
            obj.events = parseEvents(config.Events[obj.id],obj.id);
            obj.actions = parseActions(config.Actions[obj.id],obj.id);
        }catch(error){
            warning.push(`Trigger ${item} has error in its events or actions`);
            console.log(error);
        }
        

        

        // customized nodes property
        obj.shape = "box";
        obj.mass = 2;
        if(obj.disabled){
            obj.color = {border:'red',highlight:{border:'red'}};
        }
        if(unique_id.has(item)){
            warning.push(`ID ${item} duplicated!`);
        }else{
            nodes.push(obj);
            unique_id.add(obj.id)
        }
               

    }

    for(var item in config.VariableNames){
        var temp = config.VariableNames[item].split(',');
        nodes.push({id:'L'+item,label:temp[0],initValue:temp[1],shape:"hexagon",mass:4});
   }
   result = {nodes, edges, warning};
   return result;
    




    // disjoint set find representative for element
    function findRep(id){
        if(disjointTrigger[id]!=id){
            disjointTrigger[id] = disjointTrigger[disjointTrigger[id]];
            return findRep(disjointTrigger[id]);
        }else{
            return id;
        }
    }
    // action parsing
    function parseActions(str,parent_id){
        var arr = str.split(',');
        var actions = [];
        const n = arr[0];
        for(var i=1;i<arr.length;i+=8){
            var obj = {};
            obj.type = parseInt(arr[i]);
            obj.p = [];
            for(var j=1;j<8;j++){
                obj.p.push(arr[i+j]);
            }
            actions.push(obj);
            switch(obj.type){
                case 12:
                    edges.push({from: parent_id, to: obj.p[1], arrows: "to", color: "#FFFF00"});
                    break;
                case 22:
                    edges.push({from: parent_id, to: obj.p[1], arrows: "to", color: "#0000FF"});
                    break;
                case 53:
                    edges.push({from: parent_id, to: obj.p[1], arrows: "to", color: "#00FF00"});
                    break;
                case 54:
                    edges.push({from: parent_id, to: obj.p[1], arrows: "to", color: "#FF0000"});
                    break;
                case 56:
                    edges.push({from: parent_id, to: 'L' + obj.p[1], arrows: "to", color: "#00FF00", dashes: true});
                    break;
                case 57:
                    edges.push({from: parent_id, to: 'L' + obj.p[1], arrows: "to", color: "#FF0000", dashes: true});
                    break;
                case 28:
                    edges.push({from: parent_id, to: 'G' + obj.p[1], arrows: "to", color: "#00FF00", dashes: true});
                    addGV(obj.p[1]);
                    break;
                case 29:
                    edges.push({from: parent_id, to: 'G' + obj.p[1], arrows: "to", color: "#FF0000", dashes: true});
                    addGV(obj.p[1]);
                    break;
            }
            // just in case there are some extra parameters left behind, break the loop before those can be parse as a different actions
            if(actions.length == n) break;
        }
        return actions;
    }

    // events parsing
    function parseEvents(str,parent_id){
        var arr = str.split(',');
        var events = [];
        for(var i=1;i<arr.length;i+=3){
            var obj = {};
            obj.type = parseInt(arr[i]);
            flag = parseInt(arr[i+1]);
            
            if(flag == 2){
                obj.p = [arr[i+2],arr[i+3]];
                i++;
            }else{
                obj.p = [arr[i+2]];
            }
            switch(obj.type){
                // local variable: set
                case 36:
                    edges.push({from: 'L' + obj.p[0], to: parent_id, arrows: "to", color: "#00FF00", dashes: true});
                    break;
                // local variable: set
                case 37:
                    edges.push({from: 'L' + obj.p[0], to: parent_id, arrows: "to", color: "#FF0000", dashes: true});
                    break;
                // global variable: clear
                case 27:
                    edges.push({from: 'G' + obj.p[0], to: parent_id, arrows: "to", color: "#00FF00", dashes: true});
                    addGV(obj.p[0]);
                    break;
                // global variable: clear
                case 28:
                    edges.push({from: 'G' + obj.p[0], to: parent_id, arrows: "to", color: "#FF0000", dashes: true});
                    addGV(obj.p[0]);
                    break;
            }
            events.push(obj);
        }
        return events;
    }

    // global variable helper function
    function addGV(num){
        if(!unique_id.has('G'+num)){
            nodes.push({id:'G'+num,label:`Global Variable ${num}`,shape:"dot",mass:4});
            unique_id.add('G'+num)
        }
    }
}

function bind_coll(){
    var coll = document.getElementsByClassName("collapsible");

    for (var i = 0; i < coll.length; i++) {
        coll[i].addEventListener("click", function() {
            this.classList.toggle("active");
            var content = this.nextElementSibling;
            if (content.style.maxHeight != '0px'){
                content.style.maxHeight = '0px';
            } else {
                content.style.maxHeight = content.scrollHeight + "px";
            }
        });
        
    }
}
/**
 * 
 * @param {String} str, waypoint represented in alphabet 
 * @returns {Number}
 */
function wp(str){
    const alp = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    var r = 0;
    for(var i=0;i<str.length;i++){
        
        r = r*26 + alp.indexOf(str[i]) + 1;
    }
    
    return (r - 1);
}
