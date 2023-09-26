import {MidiParser} from './midi-parser.js'
import MidiWriter from "https://cdn.skypack.dev/midi-writer-js@2.1.4";
    // select the INPUT element that will handle
    // the file selection.

    
    let loading = document.getElementById('loading');
    loading.style.display = "none"
    var result = [];    
    var result2 = [];
    let changeBPM = [];
    let changeSig = [];
    let elemTrack;
    let metaTrack;
    var tracks = [];
    var timeDiv = 960;

    tracks[0] = new MidiWriter.Track();

    window.result = result;
    window.result2 = result2;


    let source = document.getElementById('filereader');
    let source2 = document.getElementById('filereader2');

    source.addEventListener("change", showLoading);
    
    function showLoading(e) {
      loading.style.display = "block"
    }


    // provide the File source and a callback function
    MidiParser.parse( source, function(obj){

      console.log(obj);

      //If there is metatrack, we assume track in index 1 will contain the midi notes. 
      // This code doesn't work for multitrack midi files.
      if (obj.tracks > 1) {
        metaTrack = obj.track[0].event;
        elemTrack = obj.track[1].event;

      
        let metaTicks = 0;

        for (var l in metaTrack){

        metaTicks = metaTicks + metaTrack[l].deltaTime;
          
        //Tempo Changes
          if (metaTrack[l].metaType == 81){
            // Add to bpm array
            changeBPM.push([metaTicks,metaTrack[l].data]);

            //Add the tempo event to the output meta track
            var bpm = (1000000 / metaTrack[l].data) * 60;
            var deltaTicks = metaTrack[l].deltaTime;
            var newEvent = new MidiWriter.TempoEvent({bpm: bpm.toString(), delta: deltaTicks.toString()});
            tracks[0].addEvent(newEvent);
          }
          
          //Signature Changes
          if (metaTrack[l].metaType == 88){

            //Add to sig array
            changeSig.push([metaTicks,[metaTrack[l].data[0],metaTrack[l].data[1]]]);
            
            //Add to output meta track. We bound each sig event to a tempo event as signature changes don't allow the adding of a delta time
            if (changeBPM.length>0){
              var bpm = (1000000 / changeBPM[changeBPM.length - 1][1]) * 60;
              var deltaTicks = metaTrack[l].deltaTime;
              var newAuxEvent = new MidiWriter.TempoEvent({bpm: bpm.toString(), delta: deltaTicks.toString()});
              tracks[0].addEvent(newAuxEvent);
            }
            //Now we add the actual Signature change event
            tracks[0].setTimeSignature(metaTrack[l].data[0],metaTrack[l].data[1]);

            


          }

        }
      console.log("metaTrack: " );
      console.log(metaTrack);

      }

      else {
      elemTrack = obj.track[0].event;}
      
      //console.log(changeSig);
      //console.log(elemTrack);
    

      let ticks_per_quarter = obj.timeDivision;
      let currentTicks = 0;
      let currentTime = 1;
      let currentBar = 1 ;
      let currentBPM = 144;
      let currentDenom = 4;
      let currentNum = 2;
      let delta;
      let delta_msec;
      let k = 0;


      for(var i in elemTrack) {

        /*if (j < changeBPM.length) {
          if (currentTicks + elemTrack[i].deltaTime >= changeBPM[j][0]){
            currentBPM = (1000000 / changeBPM[j][1]) * 60;
            console.log("changed BPM");
            j = j + 1;
          }

        }

        if (k < changeSig.length) {
          if (currentTicks + elemTrack[i].deltaTime >= changeSig[k][0] ) {
            currentNum = changeSig[k][1][0];
            console.log(currentTicks + ": changed signature to " + currentNum);
            k = k + 1;
          }
        }*/



       
          currentTicks = currentTicks + elemTrack[i].deltaTime;

          
          var bar = 1;

          for(var j=0; j<changeSig.length;j++){
            //if the current tick is beyond the next change of signature, we calculate the bars directly by division
            if(j < changeSig.length - 1){
              if(changeSig[j+1][0]<currentTicks){
                bar = bar + (changeSig[j+1][0] - changeSig[j][0])/(ticks_per_quarter * changeSig[j][1][0]);
              }
              else {
                bar = bar + (currentTicks - changeSig[j][0])/(ticks_per_quarter * changeSig[j][1][0]);
                currentNum = changeSig[j][1][0];
                break;
              }
            }

            else {
              bar = bar + (currentTicks - changeSig[j][0])/(ticks_per_quarter * changeSig[j][1][0]);
              currentNum = changeSig[j][1][0];
              break;
            }
            

          }


          currentBar = Math.floor(bar);

          let cQ = bar - currentBar;

          let currentQuarter = Math.floor((cQ * currentNum) + 1);

          let cT =  (cQ - (currentQuarter - 1) / currentNum) / (1/currentNum);

          let currentTick = Math.floor((cT * ticks_per_quarter));

     
          
          if (elemTrack[i].type == 8) {
          result.push([currentTicks, currentBar + "." + currentQuarter + "." + currentTick ,"NOTE_OFF", elemTrack[i].data[0],elemTrack[i].data[1],1,"",""]);
          }

          if (elemTrack[i].type == 9) {
          result.push([currentTicks, currentBar + "." + currentQuarter + "." + currentTick ,"NOTE_ON", elemTrack[i].data[0],elemTrack[i].data[1],1,"",""]);
          }

       
      }

      console.log(result);

      


      for(var row in result){



        if(result[row][2]=="NOTE_ON"){
          result2.push([result[row][0],result[row][1],result[row][3],result[row][4]]);
          
          for (var secRow = parseInt(row) + 1; secRow < result.length; secRow++) {
            // console.log(result[1]);
            if (result[secRow][2]=="NOTE_OFF" && result[secRow][3]==result[row][3]){
              result2[result2.length - 1].push(result[secRow][1]);
              break;
            }
            
          }
        
        }

      }


 

    loading.style.display = "none"
    } );

    //Handling Recorded times midi file
     MidiParser.parse( source2, function(obj){
      
    timeDiv = obj.timeDivision;
    metaTrack = [];
    changeBPM = [];

     
      if (obj.tracks > 1) {
        metaTrack = obj.track[0].event;
        elemTrack = obj.track[1].event;


       
        let metaTicks = 0;

        for (var l in metaTrack){

        metaTicks = metaTicks + metaTrack[l].deltaTime;
          if (metaTrack[l].metaType == 81){
             console.log("addedmeta");
            changeBPM.push([metaTicks,metaTrack[l].data]);
          }


        }
        var row = 0;


        
        for (let j=0;j<changeBPM.length;j++){
          /*console.log("j= " + j);
          console.log("changeBPM= " + changeBPM);
          console.log("changeBPM.length= " + changeBPM.length);
          console.log("changeBPM[j+1]= " + changeBPM[parseInt(j)+1]);*/
          

          if (j < changeBPM.length - 1 && row < result2.length){
            while(result2[row][0]<changeBPM[j+1][0] ){
              result2[row].push((1000000 / changeBPM[j][1]) * 60);
              row = row + 1;
              if (row == result2.length) {
                break;
              }
              // console.log("changeBPM[j+1][0]= " + changeBPM[j+1][0]);
              // console.log("result2[row][0]= " + result2[row][0]);
            }
          }
          else {
            while(row < result2.length){
              result2[row].push((1000000 / changeBPM[j][1]) * 60);
              row = row + 1;
            }
          }
        }

        }

      else {
        console.log("ERROR: midi file contains no track for tempo.");
      }





      const sp = Spreadsheet('#midispreadsheet');
      sp.createSpreadsheet(
        {
            // bar: 'text',
            // message_type: 'text',
            // 'pitch': 'number',
            // 'velocity': 'number',
            // 'recorded_tempo': 'number',
            // Start_Ctrl: 'text',
            // End_Ctrl: 'text',
            
            tickInit: 'text',
            barInit: 'text',
            pitch: 'text',
            'velocity': 'number',
            barEnd: 'text',
            recTempo: 'text',


          },
          {
            data: result2,
          }
        );

       
       
  
     
     
     
     
        var notes;
        var tracks = [];

tracks[0] = new MidiWriter.Track();
tracks[1] = new MidiWriter.Track();


var pitch;
var vel ;
var diff;
var duration ;
var tDuration;
var wait;
var tWait;

var factor = 128/timeDiv;
var curTempo = 120;



//Meta-events first:

//Look for first tempo value for using as default
for (var j = 0; j  < metaTrack.length; j++){
  if (metaTrack[j].metaType == 81){
    curTempo = 60000000 / metaTrack[j].data;
    break;
  }
}

var deltaMeta = 0;

for (var j = 0; j  < metaTrack.length; j++){
  deltaMeta = deltaMeta + metaTrack[j].deltaTime;

  //Tempo messages
  if (metaTrack[j].metaType == 81){
    var tempo = new MidiWriter.TempoEvent({bpm: 60000000 / metaTrack[j].data, delta: deltaMeta * factor});
    tracks[0].addEvent(tempo);
    curTempo = 60000000 / metaTrack[j].data;
    deltaMeta = 0;
  }

  //TODO: Time Signature messages:
  if (metaTrack[j].metaType == 88){
    var tempo = new MidiWriter.TempoEvent({bpm: curTempo, delta: deltaMeta * factor});
    tracks[0].addEvent(tempo);
    deltaMeta = 0;
    tracks[0].setTimeSignature(metaTrack[j].data[0], 2 * metaTrack[j].data[1]);

  }


}



// We leave the last element to be handled by separate at the end
for (var j = 0; j  < result2.length - 1; j++){

  duration = (result2[j + 1][0] - result2[j][0]) * factor;
  tDuration = "t" + duration;
 
  //IMPORTANT: hee we are assuming no chords, i.e. only monophonic midi files. This can translate in the following condition:
  if (duration > 0){

    //First handle first note
    if (j == 0){

      //If first note doesnt play straight away add wait
      if (result2[j][0]>0){
        wait = result2[j][0] * factor;
        tWait = "t" + wait;
        tracks[1].addEvent(new MidiWriter.NoteEvent({pitch: result2[j][2], duration: tDuration, wait: tWait, velocity: result2[j][3]}));
      }
      else {
        tracks[1].addEvent(new MidiWriter.NoteEvent({pitch: result2[j][2], duration: tDuration, velocity: result2[j][3]}));
      } 
    }


    //Handle single notes (no chords)
    else {
      tracks[1].addEvent(new MidiWriter.NoteEvent({pitch: result2[j][2], duration: tDuration, velocity: result2[j][3]}));
    }
    

    

  }

  
} 

window.metaTrack = metaTrack;

//We write the last note with an arbitrary duration of 20 ticks
tracks[1].addEvent(new MidiWriter.NoteEvent({pitch: result2[result2.length - 1][2], duration: 't20', velocity: result2[result2.length - 1][3]}));

var write = new MidiWriter.Writer(tracks);

console.log(write.dataUri());

const downloadURI = (uri, name) => {
  const link = document.createElement("a");
  link.download = name;
  link.href = uri;
  document.body.appendChild(link);
  link.click();
  document.body.appendChild(link);
  
}
downloadURI(write.dataUri(), 'output.midi')
     
} );

   
     

     
       
       