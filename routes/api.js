/*
*
*
*       Complete the API routing below
*
*
*/

'use strict';

var expect = require('chai').expect;
var mongoose = require('mongoose');
const { ObjectId } = require('mongodb');
mongoose.connect(process.env.MONGO_URI, {useNewUrlParser: true});

var threadSchema = mongoose.Schema({
  text: {type:String, required:true},
  created_on:{type: Date, default: Date.now},
  bumped_on:{type: Date, default: Date.now},
  reported: {type: Boolean, default: false},
  delete_password:{type:String, required:true},
  replies:[Object]   
})



module.exports = function (app) {
  
  app.route('/api/threads/:board')
      .post(function(req, res){
      var board = req.params.board
      var myboardCollection = mongoose.model(board, threadSchema)
      
      var thread = new myboardCollection(req.body)
      
      thread.save(function(err, data){
        if(err){
          throw err
        }
        else{
          res.redirect("/b/" + board)
        }
      })
  })
  .get(function(req, res){
      var board = req.params.board
      var myboardCollection = mongoose.model(board, threadSchema)
      
      myboardCollection.find().sort({bumped_on: "descending"}).select("-reported -delete_password -__v").limit(10).exec(function(err, data){
        if(err){
          throw err
        }
        else{
            var datanew
          
          datanew =  data.map((elem)=>{
              
            
            
             if(elem.replies.length >= 0){              
              var newArr=  elem.replies.sort(function(a,b){
                var c = new Date(a.created_on);
                var d = new Date(b.created_on);
                return c-d;
                }).slice(0, 3)                      
               //console.log(elem)
              var myobj={_id:elem._id,
                        text: elem.text,
                        created_on: elem.created_on,
                        bumped_on: elem.bumped_on,
                        replycount: newArr.length,
                        replies: newArr
                        }
              console.log(myobj)
              
              return myobj  
              }
            })       
          console.log(datanew)
            res.status(200).send(datanew)
        } 
      })
  })
  .delete(function(req, res){
      var board = req.params.board
      var myboardCollection = mongoose.model(board, threadSchema)
      var thread_id = req.body.thread_id
      
      myboardCollection.findOne({_id: thread_id}, function(err,data){
          if(err){
            throw err
          }
          else{
            if(req.body.delete_password === data.delete_password){
              myboardCollection.findByIdAndRemove({_id: thread_id}, function(err, data){
                if(err){
                  throw err
                }
                else{
                  res.send('success')
                }
              })
            }
            else{
              res.send('incorrect password')
            }
          }
      })
      
  })
  .put(function(req, res){
      var board = req.params.board
      var myboardCollection = mongoose.model(board, threadSchema)
      var thread_id = req.body.thread_id
      
      myboardCollection.findOne({_id:thread_id}, function(err,data){
        if(err){
          throw err
        }
        else{
          console.log(data)
          data.reported = true
          
          data.save(function(err, data){
            if(err){
              throw err
            }
            else{
              res.send("success")    
            }
          })
        }
      })
      
    
  })
    
  app.route('/api/replies/:board')
  
    .post(function(req, res){
      var board = req.params.board
      var myboardCollection = mongoose.model(board, threadSchema)
      
      myboardCollection.findOne({_id: req.body.thread_id}, function(err, data){
        if(err){  
          throw err
        }
        else{
          const { text, delete_password, thread_id } = req.body;
          data.replies.push({text: text,
                            delete_password: delete_password,
                            _id: new ObjectId(),
                            created_on: new Date(),  
                            reported: false})
          data.bumped_on = new Date()
             
          data.save(function(err, data){
            if(err){  
              throw err
            }        
            else{ 
              res.redirect("/b/"+board+"/"+req.body.thread_id)
            }
          })
        }  
      })
  })
    .get(function(req,res){
        var board = req.params.board
        var myboardCollection = mongoose.model(board, threadSchema)
        var thread_id = req.query.thread_id
        
        myboardCollection.findOne({_id: thread_id}).select("-reported -delete_password -__v").exec(function(err, data){
          if(err){
            throw err
          }
          else{   
            //console.log(data)
            res.status(200).send(data)
          }
        })
  })
    
    .delete(function(req, res){
        var board = req.params.board
        var myboardCollection = mongoose.model(board, threadSchema)
        var thread_id = req.query.thread_id
        
        myboardCollection.findOne(function(err, data){
          if(err){
            throw err
          }
          else{
                for(let i = 0; i < data.replies.length; i++){
                  if(data.replies[i].delete_password == req.body.delete_password && data.replies[i]._id == req.body.reply_id){
                     data.replies[i].text = "[deleted]"
                    
                    console.log(data.replies[i].text)
                    console.log(data.replies)
                    data.markModified("replies")
                   return data.save(function(err, data){  
                        if(err){
                        throw err   
                          }
                        else{
                          console.log(data)
                        res.send("success")
                        }
                    })
                    }
                  //else if(!(data.replies[i]._id === req.body.reply_id && data.replies[i].delete_password === req.body.delete_password)) res.send("incorrect password")
                }
            
             
            
          }
        })
  })   
    .put(function(req, res){
        var board = req.params.board
        var myboardCollection = mongoose.model(board, threadSchema)
        var thread_id = req.body.thread_id
        
    myboardCollection.findOne({_id: thread_id}, function(err, data){
      if(err){
        throw err
      }
      else{
           for(let i = 0; i < data.replies.length; i++){
             if(data.replies[i]._id === req.body.reply_id){
                 data.replies[i].reported = true
                 return  data.save(function(err, data){
            if(err){
              throw err
            }
            else{   
              res.send("success")        
            }
          })
             }
           }
        }
    })
  })

};
