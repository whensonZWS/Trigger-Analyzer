var fs = require("fs");

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

fs.readFile('C:/Users/whenson/Documents/temp map/sov10t.map','utf-8',(error,data)=>{
    if(error){
        console.log('file read fail');
    }else{
        const raw = parseText(data);
        fs.writeFile('./newNodes.json',JSON.stringify(raw,null,4),error =>{
            if(error){
                console.log(error);
            }
        });
    }
});;

// return a JSON with all the data
function parseText(data){
    config = parseINIString(data);

    var nodes = [];
    var edges = [];
    var warning = '';

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
            warning += 'None existing Triggers!!!!! <br>'
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
        obj.easy = parseInt(arr[6]);
        obj.normal = parseInt(arr[5]);
        obj.hard = parseInt(arr[4]);
        obj.disabled = parseInt(arr[3]);
        obj.events = parseEvents(config.Events[obj.id],obj.id);
        obj.actions = parseActions(config.Actions[obj.id],obj.id);

        // check if the trigger has any associated tags
        const rep = findRep(item);
        if(triggerRef[rep].length == 0){
            warning += 'unreference trigger <br>'
            continue;
        }
        // associated the repeating type with the first tag
        obj.tags = triggerRef[rep];
        obj.repeat = parseInt(config.Tags[obj.tags[0]].split(',')[0]);
        obj.link = arr[1];
        if(obj.link.trim() != '<none>'){
            edges.push({from: obj.id, to: obj.link, arrows: "to", color: '#FFA500'});
        }

        // customized nodes property
        obj.shape = "box";
        obj.mass = 2;
        if(obj.disabled){
            obj.color = {border:'red',highlight:{border:'red'}};
        }
        nodes.push(obj);       

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
                    addGV(obj.p[1],nodes);
                    break;
                case 29:
                    edges.push({from: parent_id, to: 'G' + obj.p[1], arrows: "to", color: "#FF0000", dashes: true});
                    addGV(obj.p[1],nodes);
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
                    addGV(obj.p[0],nodes);
                    break;
                // global variable: clear
                case 28:
                    edges.push({from: 'G' + obj.p[0], to: parent_id, arrows: "to", color: "#FF0000", dashes: true});
                    addGV(obj.p[0],nodes);
                    break;
            }
            events.push(obj);
        }
        return events;
    }

    // global variable helper function
    function addGV(num){
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
}