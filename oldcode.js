function parseEvents(str,parent_id,edges,nodes){
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
            // local variables
            case 36:
                edges.push({from: 'L' + obj.p[0], to: parent_id, arrows: "to", color: "#00FF00", dashes: true});
                break;
            case 37:
                edges.push({from: 'L' + obj.p[0], to: parent_id, arrows: "to", color: "#FF0000", dashes: true});
                break;
            case 27:
                edges.push({from: 'G' + obj.p[0], to: parent_id, arrows: "to", color: "#00FF00", dashes: true});
                addGV(obj.p[0],nodes);
                break;
            case 28:
                edges.push({from: 'G' + obj.p[0], to: parent_id, arrows: "to", color: "#FF0000", dashes: true});
                addGV(obj.p[0],nodes);
                break;
        }
        events.push(obj);
    }
    return events;
}

// RA trigger global variable helper function
function addGV(num,nodes){
    var flag = true;
    for(var item in nodes){
        if('G' + num == item.id){
            flag = false;
            break;
        }
    }
    if(flag){
        nodes.push({id:'G'+num,label:`Global Variable ${num}`,shape:"dot",mass:4});
    }
}

function parseActions(str,parent_id,edges,nodes){
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
                addGV(obj.p[1],nodes);
                break;
            case 29:
                edges.push({from: parent_id, to: 'G' + obj.p[1], arrows: "to", color: "#FF0000", dashes: true});
                addGV(obj.p[1],nodes);
                break;
        }
        if(actions.length == n) break;
    }
    return actions;
}

function parseText(data){
    config = parseINIString(data);
    var nodes = [];
    var edges = [];
    var warning = '';
    const id_pool = {};
    for(var item in config.Tags){
        var temp = config.Tags[item].split(',');
        var obj = {};
        obj.tag_id = item;
        obj.repeat = parseInt(temp[0]);
        obj.id = temp[2];
        if(id_pool[obj.id]!=undefined){
            nodes[id_pool[obj.id]].tag_id += `, ${obj.tag_id}`;
            continue;
        }else{
            id_pool[obj.id] = nodes.length;
        }
        if(config.Triggers[obj.id] == undefined) {
            warning += `Tag (ID: ${obj.tag_id}) points to a none existing Trigger ID: ${obj.id}. This Trigger is ignored.<br>`;
            continue;
        }
        var arr = config.Triggers[obj.id].split(',');
        obj.label = arr[2];
        obj.house = arr[0];
        obj.link = arr[1];
        if(obj.link.trim() != '<none>'){
            edges.push({from: obj.id, to: obj.link, arrows: "to;from", color: '#FFA500'});
        }
        obj.easy = parseInt(arr[6]);
        obj.normal = parseInt(arr[5]);
        obj.hard = parseInt(arr[4]);
        obj.disabled = parseInt(arr[3]);
        obj.events = parseEvents(config.Events[obj.id],obj.id,edges,nodes);
        obj.actions = parseActions(config.Actions[obj.id],obj.id,edges,nodes);
        obj.shape = "box";
        obj.mass = 2;
        if(obj.disabled){
            obj.color = {border:'red',highlight:{border:'red'}};
        }
        nodes.push(obj);
        //console.log(obj);
        
    }
    for(var item in config.VariableNames){
         var temp = config.VariableNames[item].split(',');
         nodes.push({id:'L'+item,label:temp[0],initValue:temp[1],shape:"hexagon",mass:4});
    }
    result = {nodes, edges, warning};
    return result;
}