#Distributed Data Processing & Workflow Deployment

This project’s purpose is to explore the use of Kubernetes and the tools it provides for deploying cloud-based solutions. This entails creating a distributed workflow to execute in multiple containers and test the effectiveness 
of different cloud mechanisms, such as cloud architecture, component scheduling, and resource allocation, for the given workflow. 

The background knowledge needed for the project largely comes from the required reading links provided in the project document. To briefly describe this background information, Kubernetes provides a range of mechanisms to manage 
cloud deployments. These mechanisms include things like node and pod affinity and anti-affinity, node taint and pod toleration, deployment topology, scheduler configurations and algorithms, and horizontal autoscalers. 

This project will utilize all the aforementioned background knowledge by testing the performance of different configurations for a cloud deployment. First, the workflow of the deployment must be created, which requires work not 
associated with Kubernetes. Then, the deployment must be created, and the components must be connected using Kubernetes mechanisms like Services and Ingresses. Finally, the above topics come into play in optimizing the performance 
of the deployment. 

##References to run the project

##Build Image - In Application
docker build -t [repo_name]/output-streaming:latest .

##Push Image - In Application
docker push [repo_name]/output-streaming:latest

##Run Image on Port 8080 - In Application
docker run -p 8080:8080 [repo_name]/output-streaming:latest

##Pull Image - In VM
docker pull [repo_name]/output-streaming:latest

##Update deployment on VM
sudo k3s kubectl set image deployment/outputstreaming-deployment \ output-streaming=thivu19/output-streaming:latest

#Redeploy
sudo k3s kubectl rollout restart deployment/outputstreaming-deployment

##Check image on VM
sudo docker images
sudo k3s kubectl describe pod <pod-name> | grep Image:

##Edit yaml file (in directory)
sudo nano [filename].yaml

##Apply yaml file (in directory)
sudo k3s kubectl apply -f [filename].yaml

##Get information about nodes
sudo k3s kubectl describe nodes

##Get your VM IP => Cloud VM (AWS/Azure/GCP)
This allows you to open up the page on your local machine to view when deployed on the VM.

Check the Public IPv4 or External IP in your VM dashboard.
Example: 34.201.50.25

Local VM (VirtualBox, VMware, etc.)
SSH into your VM:
ssh user@<VM_HOSTNAME>

Run:
ip addr show
or
csa-6343-102 -I

Example output:
192.168.56.101

Use the IP under your main network interface (usually eth0 or ens33).
Step 2: Edit your local machine’s hosts file
Windows
Open Notepad as Administrator
Open: C:\Windows\System32\drivers\etc\hosts
Add a line:
<VM_IP> outputstreaming.local

Example:
192.168.56.101 outputstreaming.local

Save and exit.

##URL link to open up the frontend
http://outputstreaming.local/index.html
