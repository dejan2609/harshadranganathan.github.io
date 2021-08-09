

| |Spring Cloud Config Server |Kubernetes ConfigMaps |AWS App Config|
|---|---|---|---|
|Config Format |	Plain text, yml, properties, json |	Configuration files, property keys |* YAML, JSON, or text documents in the AWS AppConfig hosted configuration store<br/>* Objects in an Amazon Simple Storage Service (Amazon S3) bucket<br/>* Documents in the Systems Manager document store<br/>* Parameters in Parameter Store |
|Config Size Limit | NA| 1MB| * 4 to 8KB - Parameter Store<br/>* 64KB - Document/AppConfig store<br/>* 1MB - S3|
|Config Source| Git, Local, S3, JDBC database, Redis, Vault with Proxy Support| Cluster ConfigMaps| AppConfig Store, SSM Document Store, Parameter Store, S3|
|Immutable Config|For spring apps, using immutable configuration properties would prevent bean recreation |* v1.19 beta support<br/>* ConfigMap and Pods need to be re-created |For spring apps, using immutable configuration properties would prevent bean recreation|
| Config Refresh|* Push/Poll Model<br/>* Push Model - Github Webhooks, Spring Cloud Bus| * Approach 1: Use events api to watch for changes and reload beans/context (supported by spring-cloud-kubernetes) <br/>* Approach 2: Restart the pods as part of deployment on config changes (Helm using sha256 checksum)<br/>* Approach 3: Mounted ConfigMaps are automatically refreshed by Kubernetes. So, we need reload capability in our app upon change.| Poll model|
| Deployment Strategy|NA | * Possible to use rolling update strategy of deployments e.g. https://github.com/fabric8io/configmapcontroller<br/>* Also, we can achieve config deployment rollout using Helm by checking for sha256 checksum| Linear, Exponential, AllAtOnce, Linear50PercentEvery30Seconds, Canary10Percent20Minutes|
| Sharing Config Across Apps| | | |
| Encryption & Decryption for Passwords||Need to use Secrets/Vault(supported by spring-cloud-kubernetes) |Secrets need to be stored in parameter store. No encryption/decryption feature available as part of config files |
| High Availability| * Multiple load balanced cloud config servers<br/>* (Optional) Discovery Client - e.g. Eureka| EKS resiliency - Three etcd nodes that run across three Availability Zones within a Region| AWS managed|
|Advantages | REST API can be used by non-Spring apps| * Kubernetes native solution<br/>* For Spring apps, spring-cloud-kubernetes helps to run spring apps in Kubernetes using native services| Validation checks, deployment strategy and rollbacks|
|Disadvantages |* Single point of failure without HA<br/>* Additionally, we might need Discovery Client & Cloud Bus depending on the design | ConfigMaps consumed as environment variables are not updated automatically and require a pod restart| AWS managed service|
