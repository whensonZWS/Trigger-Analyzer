var fs = require("fs");

var edges = [];
var data = {};
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

// fs.readFile('./sexist.map','utf-8',(error,data)=>{
//     if(error){
//         console.log('file read fail');
//     }else{
//         config = parseINIString(data);
//         var nodes = [];
//         for(var item in config.Tags){
//             var temp = config.Tags[item].split(',');
//             var obj = {};
//             obj.tag_id = item;
//             obj.repeat = parseInt(temp[0]);
//             obj.id = temp[2];
//             var arr = config.Triggers[obj.id].split(',');
//             obj.label = arr[2];
//             obj.house = arr[0];
//             obj.link = arr[1];
//             obj.easy = parseInt(arr[6]);
//             obj.normal = parseInt(arr[5]);
//             obj.hard = parseInt(arr[4]);
//             obj.disabled = parseInt(arr[3]);
//             obj.events = parseEvents(config.Events[obj.id]);
//             obj.actions = parseActions(config.Actions[obj.id],obj.id);
//             if(obj.disabled){
//                 obj.color = {border:'red'};
//             }else{
//                 obj.color = {border:'#2B7CE9'}
//             }
//             nodes.push(obj);
//             //console.log(obj);
//         }
//         data = {nodes, edges};
//         fs.writeFile('./nodes.json',JSON.stringify(data),error =>{
//             if(error){
//                 console.log(error);
//             }
//         });
//     }
// });

fs.readFile('./fadata.ini','utf-8',(error,data)=>{
    if(error){
        console.log('unable to read fadata.ini');
    }else{
        config = parseINIString(data);
        events = []; 
        for(var item in config.EventsRA2){
            var arr = config.EventsRA2[item].split(',');
            var obj = {};
            obj.name = arr[0];
            obj.description = arr[5];
            obj.p = [parseInt(arr[1]),parseInt(arr[2]),parseInt(arr[3])];
            events.push(obj);
        }
        actions = []; 
        for(var item in config.ActionsRA2){
            var arr = config.ActionsRA2[item].split(',');
            var obj = {};
            obj.name = arr[0];
            obj.description = arr[10];
            obj.p = [parseInt(arr[1]),parseInt(arr[2]),parseInt(arr[3]),parseInt(arr[4]),parseInt(arr[5]),parseInt(arr[6]),parseInt(arr[7])];
            actions.push(obj);
        }
        
        fs.writeFile('./fadata.json',JSON.stringify({events,actions}),error =>{
            if(error){
                console.log(error);
            }
        });
    

        
    }
});

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

function parseActions(str,parent_id){
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

