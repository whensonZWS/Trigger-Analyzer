
// global variables
var container = document.getElementById('mynetwork');
var focusOptions = {
    scale: 1,
    offset: {x: 0, y: 0},
    animation: {duration: 1000,easingFunction: "easeInOutQuad"},
};

var networkData = {
    nodes: [
        {id:0, label: "Load a Red Alert 2 map file",    shape: "box"},
        {id:1, label: "to see the triggers!",           shape: "box"},
        {id:2, label: "Drag and drop also works works!",shape: "box"}
    ],
    edges: [
        {from: 0,to: 1,arrows: "to", length: 250, color: '#00FF00'},
        {from: 2,to: 1,arrows: "to", length: 250, color: '#00FF00'},
        {from: 0,to: 2,arrows: "to;from", length: 250, color: '#FFA500'}

    ]
};

var networkOptionsDefault = {
    interaction: {
        navigationButtons: true,
        keyboard: true
    },
    physics: {
        enabled: true,
        barnesHut: {
            springConstant: 0.05,
            centralGravity: 0.4
        },
    },
    layout:{
        hierarchical:{
            enabled: false
        }
    },
    edges:{
        width: 3,
        selectionWidth: w => w*2,
        length: 150
    },
    nodes:{
        widthConstraint:{maximum: 200}
    }
};

var networkOptionsTree = {
    layout:{
        hierarchical:{
            enabled: true,
            direction: 'LR',
            sortMethod: 'hubsize',  // hubsize, directed
            // directed is the natural choice for hierachy layout, however, looping confuse the graph algorithm and produce ugly graph
            // using hubsize by default, but directed is not out of the question yet in future version
        }
    },
    physics:{
        enabled: true,
        hierarchicalRepulsion: {
            avoidOverlap: 0.5
        }
    }
}

// simple init
//var nodesView = new vis.DataView(networkData);
var network = new vis.Network(container, networkData, networkOptionsDefault);

// global options for filters
var nodeFilterOptions = {
    triggers: true,
    variables: true,
    easy: true,
    normal: true,
    hard: true
};

var nfs = document.getElementById("nodeFilterSelect");
nfs.addEventListener("change", (e) => {
    switch(e.target.value){
        case "all":
            nodeFilterOptions.triggers = true;
            nodeFilterOptions.variables = true;
        break;
        case "triggers":
            nodeFilterOptions.triggers = true;
            nodeFilterOptions.variables = false;
        break;
        
        case "variables":
            nodeFilterOptions.triggers = false;
            nodeFilterOptions.variables = true;
        break;
    }
    nodesView.refresh();
});

// for easy normal hard check box
document.getElementById('easyFilter').onchange = quickFilter('easy');
document.getElementById('normalFilter').onchange = quickFilter('normal');
document.getElementById('hardFilter').onchange = quickFilter('hard');
function quickFilter(str){
    return function (e){
        nodeFilterOptions[str] = e.target.checked;
        nodesView.refresh();
    };
}




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

    if(e.target.checked){
        network.setOptions(networkOptionsTree);
    }else{
        network.setOptions(networkOptionsDefault)
    }
    document.getElementById('physicsCheck').checked = true;

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


 
container.ondragover = function(e){
    e.preventDefault();
};
container.ondrop = function(e) {
    
    var fileInput = document.getElementById('fileInput');
    fileInput.files = e.dataTransfer.files;
    const event = new Event('change');
    fileInput.dispatchEvent(event);
    e.preventDefault();
    
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
    if(raw == null) return;
    // Triggers:
    if(raw.house){
        // ID and Label
        var d0 = document.createElement('div');
        d0.innerHTML = `
            <div class='listItem'>Name:&nbsp;${raw.label}</div>
            <div class='listItem'>ID:&nbsp;${raw.id}</div>
            `;
        
        var d1 = document.createElement('details');
        var s1 = document.createElement('summary');
        s1.innerHTML = 'Basic Info';
        d1.appendChild(s1);
        d1.open = true;
        const tags = raw.tags.join(',&nbsp')
        d1.innerHTML +=  `
            <div class='listItem'>House: ${raw.house}</div> 
            <div class='listItem'>Repeat: ${raw.repeat}</div>
            <div class='listItem'>Tags: ${tags} </div>`
        if(raw.link.trim() != '<none>'){
            console.log(raw.link);
            d1.innerHTML +=  `
            <div class='listItem'>Link Trigger: ${raw.link}</div>`
        }
        easy = raw.easy?'green':'red';
        normal = raw.normal?'green':'red';
        hard = raw.hard?'green':'red';
        disabled = raw.disabled?'red':'green';
        d1.innerHTML += `<div class='listItem'>Difficulty:&nbsp;<span class='${easy}'>Easy</span>&nbsp;&nbsp;<span class='${normal}'>Normal</span>&nbsp;&nbsp;<span class='${hard}'>Hard</span></div>`;
        d1.innerHTML += `<div class='listItem'>Disabled:&nbsp;<span class='${disabled}'>${raw.disabled?"True":"False"}</span></div>`;
        
        // events
        var d2 = document.createElement('details');
        var s2 = document.createElement('summary');
        s2.innerHTML = `Events`;
        d2.appendChild(s2);
        d2.open = true;

        for(var i=0;i<raw.events.length;i++){
            var t = raw.events[i].type;
            var d = document.createElement('div');
            d.className = 'listItem';
            d.innerHTML += `Event ${i}: ${events[t].name}`;
            d.title = `${t}: ${events[t].description}`;
            // check if the events type has more than 2 variables in its parameter
            if(events[t].p[0] > 0){
                d.innerHTML += ` ${raw.events[i].p[0]} ${raw.events[i].p[1]}`;
            }else{
                d.innerHTML += ` ${raw.events[i].p[0]}`
            }
            d2.appendChild(d);
        }

        //actions
        var d3 = document.createElement('details');
        var s3 = document.createElement('summary');
        s3.innerHTML = `Actions`;
        d3.appendChild(s3);
        d3.open = true;
        for(var i=0;i<raw.actions.length;i++){
            var t = raw.actions[i].type;
            var d = document.createElement('div');
            d.innerHTML += `Action ${i}: ${actions[t].name}`;
            d.className = 'listItem';
            d.title = `${t}: ${actions[t].description}`;
            for(j=0;j<7;j++){
                if(actions[t].p[j]>0){
                    if(j!=6) d.innerHTML += ` ${raw.actions[i].p[j]}`;
                    else d.innerHTML += ` @${wp(raw.actions[i].p[j])}`;
                }
            }
            d3.appendChild(d);
        }
        info.appendChild(d0);
        info.appendChild(d1);
        info.appendChild(d2);
        info.appendChild(d3);
        /*
        var d4 = document.createElement('details');
        var s4 = document.createElement('summary');
        s4.className = 'collapsible';
        s4.innerHTML = 'Neighbouring Nodes'
        
        d4.appendChild(s4);
        for(var item of raw.neighbour){
            var d = document.createElement('div');
            d.className = 'listItem';
            d.innerHTML = `neighbour: ${item}`;
            d4.appendChild(d);
        }
        info.appendChild(d4);*/
        
    }else{
        info.innerHTML = `
            Variable <br> 
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
    nodesData = new vis.DataSet(nodes);

    const nodesFilter = (node) => {
        /**
         * filter flow:
         * triggers
         *     1 check if trigger is in filter, true -> step 3, false -> step 2
         *     2 check if it's a neighbour of variable, true -> step 3, false -> return false
         *     3 check if any the the trigger difficulty match the filter option, true -> return true, false -> return false
         * variables
         *     just check if variable is in filter
         */
        // triggers
        if(node.house != undefined){
            if(!nodeFilterOptions.triggers){
                var flag = true;
                for(var item of node.neighbour){
                    if(nodesData.get(item).house == undefined){
                        flag = false;
                        break;
                    }
                }
                if(flag) return false;
            }
            return (node.easy && nodeFilterOptions.easy) || (node.normal && nodeFilterOptions.normal) || (node.hard && nodeFilterOptions.hard);
        }else{
            return nodeFilterOptions.variables;

        }
        
    };
    nodesView = new vis.DataView(nodesData,{filter:nodesFilter});
   
    var data = {
        nodes: nodesView,
        edges: edges
    };  
    
    document.getElementById('physicsCheck').checked = true;
    document.getElementById('treeLayout').checked = false;

    network = new vis.Network(container, data, networkOptionsDefault);            
    
    network.on("click", function (params) {
        if(params.nodes.length > 0){
            const n_id = params.nodes[0];
            displayInfo(nodesView.get(n_id));
        }else if(params.nodes.length == 0){
            displayInfo(null)
        }
    });

    network.on("doubleClick", function (params) {
        if(params.nodes.length > 0){
            network.focus(params.nodes[0],focusOptions);
        }
    });

    // loading progress and info display
    var info = document.getElementById('info')
    network.on("stabilizationProgress", function (params) {
        info.innerText = "Loading: " + Math.round(params.iterations / params.total * 100) + '%\n';
        info.innerText += `Assets: \nTriggers & Variables: ${nodes.length} \nLinks: ${edges.length}`
        if(raw.warning.length > 0){
            info.innerHTML += `
                <br> <div class='yellow'> Warnings: (Check your map for potential error)</div>
                <div> ${parseWarning(raw.warning)} </div>`;
        }
    });

    network.once("stabilizationIterationsDone", function () {
        
        // info box
        info.innerText = `100% Loaded. \nAssets: \nTriggers & Variables: ${nodes.length} \nLinks: ${edges.length} `;
        if(raw.warning.length>0){
            info.innerHTML += `
                <br> <div class='yellow'> Warnings: (Check your map for potential error) </div>
                <div> ${parseWarning(raw.warning)} </div>`;
        }
        // populate node list
        var nl = document.getElementById('nodesList');
        for(var i=0;i<nodes.length;i++){
            var d = document.createElement('div');
            d.className = "listItem";
            d.title = "id: " + nodes[i].id;
            d.inner_id = nodes[i].id;
            d.innerHTML = nodes[i].label;
            d.addEventListener("click",function (e){
                displayInfo(nodesData.get(this.inner_id));
                // only focus and select when the node is in current view
                if(nodesFilter(nodesData.get(this.inner_id))){
                    network.focus(this.inner_id,focusOptions);
                    network.setSelection({nodes:[this.inner_id]});
                }
                
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
    // nodes are treated as a map for easy access, will be convert to array during output
    var nodes = new Map();
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

    // read trigger
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
        obj.neighbour = new Set();
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
            nodes.set(obj.id,obj);
            unique_id.add(obj.id)
        }
               

    }

    for(var item in config.VariableNames){
        var temp = config.VariableNames[item].split(',');
        nodes.set(
            'L'+item, 
            {
                id: 'L'+item,
                label: temp[0],
                initValue: temp[1],
                shape:"diamond", 
                mass: 4,
                neighbour: new Set()
            }
        );
    }
   // pre-processing: storing neighbour in nodes
    for(var i=0;i<edges.length;i++){
        try{
            nodes.get(edges[i].from).neighbour.add(edges[i].to);
            nodes.get(edges[i].to).neighbour.add(edges[i].from);
        }catch{
            continue;
        }
   }
   nodes = Array.from(nodes.values());
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
            nodes.set(
                'G'+num,
                {
                    id: 'G'+num,
                    label: `Global Variable ${num}`,
                    shape: "triangle",
                    mass: 4,
                    neighbour: new Set(),
                    color: {
                        border: '#FF00FF',
                        highlight: {border: '#FF00FF'}
                    }
                }
            );
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
