use std::{sync::{mpsc, Arc, Mutex}, thread};

pub struct ThreadPool{
    workers: Vec<Worker>, // vector of threads waiting to pick up code
    sender: mpsc::Sender<Job>, // sender for message passing
}
type Job = Box<dyn FnOnce() + Send + 'static>;

impl ThreadPool{
    pub fn new(size: usize) -> ThreadPool{
        assert!(size > 0);

        let (sender, receiver) = mpsc::channel(); // create channel for message passing(sender on threadpool and receiver on worker)

        let receiver = Arc::new(Mutex::new(receiver));

        let mut workers = Vec::with_capacity(size); //finite capacity

        for id in 0..size {
            workers.push(Worker::new(id, Arc::clone(&receiver))); // push worker with unique id to vector
        }
        
        ThreadPool {workers, sender} // return new instance of ThreadPool populated with workers
    }
    pub fn execute<F>(&self, f: F) // execute function
    where 
        F: FnOnce() + Send + 'static, // bounds on generic type
    {
        let job = Box::new(f);
        self.sender.send(job).unwrap();
    }
}

pub struct Worker{
    id: usize,
    thread: thread::JoinHandle<()>,// thread handle
}

impl Worker{
    fn new(id: usize, receiver: Arc<Mutex<mpsc::Receiver<Job>>>) -> Worker {
        let thread = thread::spawn(move || {
            loop{
                let job = receiver.lock().unwrap().recv().unwrap();
                println!("Worker {} got a job; executing.", id);
                job();
            }
        }); // spawn thread

        Worker { id, thread } // return new instance of Worker/thread
    }
}