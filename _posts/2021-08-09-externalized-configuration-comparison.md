

| |Spring Cloud Config Server |Kubernetes ConfigMaps |AWS App Config|
|---|---|---|---|
|Config Format |	Plain text, yml, properties, json |	Configuration files, property keys |* YAML, JSON, or text documents in the AWS AppConfig hosted configuration store<br/>* Objects in an Amazon Simple Storage Service (Amazon S3) bucket<br/>* Documents in the Systems Manager document store<br/>* Parameters in Parameter Store |
|Config Size Limit | NA| 1MB| * 4 to 8KB - Parameter Store<br/>* 64KB - Document/AppConfig store<br/>* 1MB - S3|
|Config Source| Git, Local, S3, JDBC database, Redis, Vault with Proxy Support| Cluster ConfigMaps| AppConfig Store, SSM Document Store, Parameter Store, S3|
|Immutable Config|For spring apps, using immutable configuration properties would prevent bean recreation |* v1.19 beta support<br/>* ConfigMap and Pods need to be re-created |For spring apps, using immutable configuration properties would prevent bean recreation|
| | | | |
| | | | |
| | | | |
| | | | |
| | | | |
| | | | |
| | | | |
| | | | |
| | | | |
| | | | |
| | | | |
| | | | |
| | | | |
| | | | |
| | | | |
| | | | |
| | | | |
| | | | |
| | | | |
| | | | |
| | | | |
| | | | |
