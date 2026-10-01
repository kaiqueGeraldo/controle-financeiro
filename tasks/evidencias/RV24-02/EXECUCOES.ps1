# Na raiz. Não usar banco real; infraestrutura Java mantém guard e Testcontainers.
$env:JAVA_HOME = (Resolve-Path 'controle-financeiro-backend/target/temurin21/jdk-21.0.12.1+1').Path
$env:PATH = $env:JAVA_HOME + '/bin;C:/Users/Aluga.com/AppData/Local/Programs/DockerDesktop/resources/bin;' + $env:PATH
$rvCases = 'contractLinkedDeletionMustCompleteWithoutForeignKeyFailure+ordinaryPaidPurchaseAllocationMustAlsoDeleteWithoutForeignKeyFailure+completeGraphDeletionPreservesEveryOtherRowAndNotifiesOnlyAfterCommit+intermediateDatabaseFailureRollsBackAllRowsCacheAndNotification+foreignLegacySetNullAndUuidOnlyLinksRejectDeletionWithoutChangingEitherOwner+postCommitNotificationFailureDoesNotRecreateUserOrPretendRollback'
& controle-financeiro-backend/mvnw.cmd -f controle-financeiro-backend/pom.xml --batch-mode '-Dmaven.repo.local=C:/Users/Aluga.com/.m2/repository' ("-Dtest=Rv24DeletionIntegrationTest#"+$rvCases) test
if ($LASTEXITCODE -ne 0) { throw 'Gate dirigido vermelho.' }
# Revalidação posterior inclui o sexto caso; a execução histórica afetada foi135,
# pois o sexto caso ainda não existia. Não substituir a contagem histórica por136.
$rvSelection = 'Cf024ConcurrencyCacheIntegrationTest,Rv24DeletionIntegrationTest#'+$rvCases+',MilestoneTransactionCommandTest,MilestoneInvestmentCorrectionTest,Cf018RegressionIntegrationTest,Cf020InvestmentGoalIntegrationTest,IncrementalMilestoneReviewTest,IndependentRemediationBoundaryTest,HttpContractControllerTest,EmptyDatabaseMigrationIntegrationTest,LegacyDatabaseMigrationIntegrationTest,HabitIntegrityIntegrationTest,Rv24CreationBrowserIntegrationTest,TransactionServiceTemporalTest,InvestmentServiceTemporalTest'
& controle-financeiro-backend/mvnw.cmd -f controle-financeiro-backend/pom.xml --batch-mode '-Dmaven.repo.local=C:/Users/Aluga.com/.m2/repository' ("-Dtest="+$rvSelection) '-Dreview.grep=R03' ("-Drv24.run=payment-"+[guid]::NewGuid().ToString('N')) verify
if ($LASTEXITCODE -ne 0) { throw 'Gate afetado vermelho; preservar log e diagnóstico.' }
