window.onload = function() {
    document.getElementById('searchBox').value = '';
    var fileInput = document.getElementById('fileInput');

    fileInput.addEventListener('change', function(e) {
        var file = fileInput.files[0];
			var textType = /text.*/;
			if (file.type.match(textType)) {
				var reader = new FileReader();
				reader.onload = function(e) {
					raw = parseText(reader.result);
                    generateNetwork(raw);
				}
				reader.readAsText(file);	
			} else {
				console.log("File not supported!")
			}
	});
}

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

function parseText(data){
    config = parseINIString(data);
    var nodes = [];
    var edges = [];
    for(var item in config.Tags){
        var temp = config.Tags[item].split(',');
        var obj = {};
        obj.tag_id = item;
        obj.repeat = parseInt(temp[0]);
        obj.id = temp[2];
        var arr = config.Triggers[obj.id].split(',');
        obj.label = arr[2];
        obj.house = arr[0];
        obj.link = arr[1];
        obj.easy = parseInt(arr[6]);
        obj.normal = parseInt(arr[5]);
        obj.hard = parseInt(arr[4]);
        obj.disabled = parseInt(arr[3]);
        obj.events = parseEvents(config.Events[obj.id]);
        obj.actions = parseActions(config.Actions[obj.id],obj.id,edges);
        if(obj.disabled){
            obj.color = {border:'red'};
        }else{
            obj.color = {border:'#2B7CE9'}
        }
        nodes.push(obj);
        //console.log(obj);
    }
    result = {nodes, edges};
    return result;
}

// filter
function filterFunc(){
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


//dangerous sync load!!!!!
var container = document.getElementById('mynetwork');
var focusOptions = {scale: 1,offset: { x: 0, y: 0},animation: {duration: 1000,easingFunction: "easeInOutQuad"},};
var fadata = new XMLHttpRequest();
fadata.open('GET','./fadata.json',false);
fadata.send();
var events = []
var actions = []
if(fadata.status == 200){
    fadata = JSON.parse(fadata.responseText);
    events = fadata.events;
    actions = fadata.actions;

}

// requesting files
// var xmlhttp = new XMLHttpRequest();
// var url = './nodes.json';


function displayInfo(raw){
    var info = document.getElementById('info');
    while(info.hasChildNodes()){
        info.removeChild(info.childNodes[0]);
    }
    var d1 = document.createElement('div');
    // basic info
    d1.innerText =  `Name: ${raw.label} \nID: ${raw.id}\nHouse: ${raw.house}\nRepeat: ${raw.repeat}\nDifficulty:`;
    easy = raw.easy?'green':'red';
    normal = raw.normal?'green':'red';
    hard = raw.hard?'green':'red';
    d1.innerHTML += `<span class='${easy}'>Easy</span>&nbsp;&nbsp;<span class='${normal}'>Normal</span>&nbsp;&nbsp;<span class='${hard}'>Hard</span><br><br>`;
    
    // events
    var d2 = document.createElement('div');
    d2.innerHTML += 'Events:'
    for(var i=0;i<raw.events.length;i++){
        var t = raw.events[i].type;
        var d = document.createElement('div');
        d.className = 'listItem';
        d.innerHTML += `Event ${i}: ${events[t].name}`;
        if(events[t].p[0] > 0){
            d.innerHTML += ` ${raw.events[i].p[0]} ${raw.events[i].p[1]}`;
        }else{
            d.innerHTML += ` ${raw.events[i].p[0]}`
        }
        d2.appendChild(d);
    }

    //actions
    var d3 = document.createElement('div');
    d3.innerHTML += 'Actions:'
    for(var i=0;i<raw.actions.length;i++){
        var t = raw.actions[i].type;
        var d = document.createElement('div');
        d.innerHTML += `Action ${i}: ${actions[t].name}`;
        d.className = 'listItem';
        for(j=0;j<7;j++){
            if(actions[t].p[j]>0){
                d.innerHTML += ` ${raw.actions[i].p[j]}`
            }
        }
        d3.appendChild(d);
    }
    info.appendChild(d1);
    info.appendChild(d2);
    info.appendChild(d3);
}


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
    var data = {
        nodes: nodes,
        edges: edges
    };  
    var options = {
        nodes: {
            shape: "box"
        },
        interaction: {
            navigationButtons: true,
            keyboard: true
        }
    }
    

    var network = new vis.Network(container, data, options);            
    
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


    network.on("stabilizationProgress", function (params) {
        document.getElementById('info').innerText = "Loading: " + Math.round(params.iterations / params.total * 100) + '%';
    });
    network.once("stabilizationIterationsDone", function () {
        document.getElementById('info').innerText = "Fully Loaded";
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


//xmlhttp.open('GET',url,true);
//xmlhttp.send();

function parseEvents(str){
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
        events.push(obj);
    }
    return events;
}

function parseActions(str,parent_id,edges){
    var arr = str.split(',');
    var actions = [];
    for(var i=1;i<arr.length;i+=8){
        var obj = {};
        obj.type = parseInt(arr[i]);
        obj.p = [];
        for(var j=1;j<8;j++){
            obj.p.push(arr[i+j]);
        }
        actions.push(obj);
        if(obj.type == 53){
            edges.push({from: parent_id, to: obj.p[1], arrows: "to", color: "#00FF00", width:2});
        }
        if(obj.type == 54){
            edges.push({from: parent_id, to: obj.p[1], arrows: "to", color: "#FF0000", width:2});
        }
    }
    return actions;
}
