# Matriz independente de cobertura

Expanded local do recorte autorizado pela DEC-ZOOM-05. Base examinada: `9334264d4d96e8b64a2de16090ef4c5a77496441`; candidato executado: `95118407cfe684430421d7f5c4b613a99d2b55d0`.

| Unidade | Esperado | Conferido | Evidência e limite |
|---|---:|---:|---|
| Backend Java |116 classes / 928 casos|116 / 928 únicos|XML corpo e cabeçalho reconciliados;0 falhas/erros/skips; contrato Windows uma vez|
| RF15 |25 originais =2 adiados +23 obrigatórios|23 aprovados|Projeto/arquivo/títulos exatos; dentro do wrapper Java; não somar a928|
| E2E financeiro |13 jornadas|13 identidades únicas|Listagem atual e resultados;1 wrapper Java separado;0 retry/skip|
| Componentes Linux |626 IDs /71 arquivos|626 /71|626 IDs Vitest;625 chaves arquivo+título; multiconjunto e overlays conferidos; reuso|
| Componentes Windows |626 ocorrências /71 arquivos|626 /71|JSON/audit/contexto e fechamento de inputs aceitos pelo validador final; reuso|
| Temporais |18 execuções /3 fusos|18 /3|Logs sync03 e frontend preservados; não reexecutados nesta revisão|
| Contratos HEAD |46|46 aprovados|Execução independente nova;0 falhas/skips|
| Controles dirigidos |25 garantias|25 aprovadas|Contraprovas em clones e launch real; não somar como cobertura financeira|
| Configs/seleções |9 configs E2E + CF032|10 listagens|Somente listagem;0 jornadas novas|
| Checkpoints SQL |12 selecionados por risco|12 conferidos|Cadastro/aplicação, perda de resposta/replay, isolamento, legado e3 fusos|

## Backend por classe

`java-identidades.json` privado, vinculado por SHA em RECIBOS.json, contém as928 identidades completas. Cada XML atual difere do antigo correspondente, e seu mtime está dentro da etapa backend (metadado auxiliar).

| Classe | Casos | Falhas | Erros | Skips | SHA-256 do XML |
|---|---:|---:|---:|---:|---|
|com.controlefinanceiro.api.Cf014HistoryDiagnosticTest|1|0|0|0|4a2702c3ca293791b5ffcbc9c0b77b4b04f0cee1bc78e24f32ec84492e164a90|
|com.controlefinanceiro.api.Cf014HistoryReviewTest|1|0|0|0|5c7a9b41c7596de43c8748bf10946de66de3b32bf905669f86f22fd42a7f2c69|
|com.controlefinanceiro.api.CF015PaymentRecoveryTest|2|0|0|0|f1636c110e7445f43c58b8e6724a1ca2c734e7c028af7c1d576952cecbacd9e3|
|com.controlefinanceiro.api.CF015PlanningOwnershipTest|5|0|0|0|63905ffca299af7bd2ee34e237b1d982deb1b63ce74b1c053592244fdf287641|
|com.controlefinanceiro.api.Cf019Rva03DiagnosticTest|1|0|0|0|d04620a75a1bd6eb91ada99eecc7690a4ba9d1ab1eb8cfbc117c677a916e558c|
|com.controlefinanceiro.api.ControleFinanceiroApiApplicationTests|1|0|0|0|a72d83c1953b0494d3a273d89a4d7fea955b161aae1b46107561a100547b5f87|
|com.controlefinanceiro.api.controller.AuthControllerContractTest|3|0|0|0|bd47c6b02f9b787155cdf2abb71ca6712731ed7dae54c6030117f41619cbe111|
|com.controlefinanceiro.api.controller.HttpContractControllerTest|6|0|0|0|afedae05172bb757974be5864a4e401b07d3fdffb32078ffcc5d8985d0b1fe5c|
|com.controlefinanceiro.api.controller.TemporalBoundaryReviewTest|27|0|0|0|95ae95532b26be8c7dea0b9c712c9982375c4dc387858ed9ea4c85865df9bd49|
|com.controlefinanceiro.api.DirectedGoalHistoryTemporalTest|1|0|0|0|c1835e827229bc2b6b1234f212e0089dd1ec93e8f93817f08681c778a2078d32|
|com.controlefinanceiro.api.domain.habit.HabitBrowserIntegrationTest|1|0|0|0|9320692d5939910583c54056b35e8b7afcab5d0eaff967b31f1792de9610f4a6|
|com.controlefinanceiro.api.domain.habit.HabitFixtureIsolationIntegrationTest|31|0|0|0|f5f4cc127d0d3e9e1e75b35ec69b54cee812ca6c547ecf3ff75b9cf6aeae4d56|
|com.controlefinanceiro.api.domain.habit.HabitIntegrityIntegrationTest|27|0|0|0|1990a1abca51effabd6d84b5cf36406689a9728859d24605cef8903c8b9e9a30|
|com.controlefinanceiro.api.domain.habit.HabitStreakCalculatorTest|7|0|0|0|392dd09cdbef7df12f587ec9bf67bfe019d000e50856df3bf591305b28a764f8|
|com.controlefinanceiro.api.domain.onboarding.Cf033AdversarialIntegrationTest|7|0|0|0|1836d493f7e602736f954b65e7858e2767d1e217686d0d31fdfc3d03ff48ade2|
|com.controlefinanceiro.api.domain.onboarding.Cf033CapacityCostTest|1|0|0|0|5a461a11ba6a7fab412d986246c72e83f0a1887bceda4a03e37f8a616586ed21|
|com.controlefinanceiro.api.domain.onboarding.Cf033CapacityProtocolTest|7|0|0|0|17be2d12ed7ac93ac7ff1f82506ac9e25817c96aadf9166c801179bb54ef59cc|
|com.controlefinanceiro.api.domain.onboarding.Cf033GateTransitionReviewTest|6|0|0|0|94191848469fe5ced33e3b091f75ddb8402adc365a7c127535da2acacd6c1417|
|com.controlefinanceiro.api.domain.onboarding.Cf033ProgressIndependenceProbeTest|1|0|0|0|dd6568df091e9ad38955f02b317e51778d30d47f94cbfa9369fb62bf2e2b5c51|
|com.controlefinanceiro.api.domain.onboarding.DailyReservationCapacityTest|20|0|0|0|499bfe553c3d2c3f7e8cda1ffce845444c65b0b6365d964a7115430ea1dba9ba|
|com.controlefinanceiro.api.domain.onboarding.DailyReservationConcurrencyTest|1|0|0|0|dd8c868383fa4e14dffb0b43edfa9468da12541b5a49dca2392d7e14dd648298|
|com.controlefinanceiro.api.domain.onboarding.DraftValidatorTest|41|0|0|0|3a86e435e4d2c0e73590bc220495858d5d4026f1f674d90f09c817aa29f59cb7|
|com.controlefinanceiro.api.domain.onboarding.OnboardingApplicationTest|11|0|0|0|aec726771772b8e41d7b01db6530719102bbdb36c93ffcaf24442c23700d3af2|
|com.controlefinanceiro.api.domain.onboarding.OnboardingAtomicityEventTest|1|0|0|0|00840bc18fe9d08502278a1c7d2f82f5930eb5f93c6c6d0dacaa486a99c7c39b|
|com.controlefinanceiro.api.domain.onboarding.OnboardingBoundaryTest|4|0|0|0|4bdd9193b82bf2725d6f7f744fe0832ce43d14e4315883f3c7f832e2627c8dea|
|com.controlefinanceiro.api.domain.onboarding.OnboardingCanonicalContractTest|2|0|0|0|defa00bf9d4eca36c292e170cbb5aebd5e408cefa5f6134cd38baa4e717d38ad|
|com.controlefinanceiro.api.domain.onboarding.OnboardingCapacityCostTest|3|0|0|0|bb082a301e723684d8c5f96d3f434367fd61b801210851923cbe0234615e737b|
|com.controlefinanceiro.api.domain.onboarding.OnboardingCapacityHttpTest|1|0|0|0|c603266999ad00d35601361bb5221fa5a95683b75bc91891b9712a726b931c02|
|com.controlefinanceiro.api.domain.onboarding.OnboardingForeignZoneReviewTest|12|0|0|0|de75a9d9913041f162d296404376975a758b9cec5a3867acf1503bec273af8a3|
|com.controlefinanceiro.api.domain.onboarding.OnboardingGoalRevalidationTest|43|0|0|0|9a50b769c0e7d227db10e4caa7c724238eb8935386baf488be1f066984e64c04|
|com.controlefinanceiro.api.domain.onboarding.OnboardingIndependentContractTest|3|0|0|0|ddd8a4de0c182fb9edd52bde023ade8919b6f82af636c09e54e5692b1ec862c6|
|com.controlefinanceiro.api.domain.onboarding.OnboardingIndependentReviewTest|22|0|0|0|ae126478bb7ce2c17eff3df654ee79874822069f1329b0e59653f62aabf1bff4|
|com.controlefinanceiro.api.domain.onboarding.OnboardingIntegrationTest|11|0|0|0|34d963befcaf9a6144c2fb3ea701a3bf81466721a07866d3c126dd24623cc548|
|com.controlefinanceiro.api.domain.onboarding.OnboardingLifecycleConcurrencyTest|7|0|0|0|7486b296cd7c903e4f6039a5e55e6b1474e26fd331f8b70f4d60fa1bedf9317d|
|com.controlefinanceiro.api.domain.onboarding.OnboardingMigrationPoolIsolationTest|2|0|0|0|6be7cc137eddc132e8083cc2aa1796ae38ecfac3f24716963f5f5593590d124c|
|com.controlefinanceiro.api.domain.onboarding.OnboardingMigrationTest|1|0|0|0|4bacfd7c33e2f7397e646cdef513513567b28b15593887acb6b6128e66c7ef19|
|com.controlefinanceiro.api.domain.onboarding.OnboardingPrecisionProtocolTest|7|0|0|0|2fa94bc3c8b68a5daedbb901701c6c611f2a321e8e19563e86abb21aea5fca1b|
|com.controlefinanceiro.api.domain.onboarding.OnboardingRc030CivilTest|10|0|0|0|18b9de5ed47cdf8b471369c7240467e1c2671153bd15e86ec0365a08fc234c6e|
|com.controlefinanceiro.api.domain.onboarding.OnboardingRc030PaymentTest|7|0|0|0|9fd29a8011484f089bbb4888ee7f0d437a7852928f6a2d9473754c2ed82a6778|
|com.controlefinanceiro.api.domain.onboarding.OnboardingRc030VersionTest|32|0|0|0|47b44a3f0b9340985d5d091ec6a731c9ee48809cc91b4211176f19b2e5993a74|
|com.controlefinanceiro.api.domain.onboarding.OnboardingReservationIssueTest|40|0|0|0|b2e4931411ac65e144cddc72fb5c7146cbcdf0d79b98c5e6400fd9eff2385a9e|
|com.controlefinanceiro.api.domain.onboarding.OnboardingReservationsTest|9|0|0|0|0fee115d256bfa74e59e27b8c8fd875d083182da66dddc0bd582879c136235d7|
|com.controlefinanceiro.api.domain.onboarding.OnboardingRevalidationCivilTest|22|0|0|0|ca3f4e2201af35325a656bd1ae81811096210e9553fda43ff75637617db45b48|
|com.controlefinanceiro.api.domain.onboarding.OnboardingReviewConcurrencyTest|8|0|0|0|e22080bb7465968e964bc46d3fa8f82169614f1a3cc5a2ddb7147e13838da651|
|com.controlefinanceiro.api.domain.onboarding.OnboardingReviewFinancialTest|5|0|0|0|e7fe9b874cec8088570c60bc23b41023c7b784c25adf1f7bdc5def29c189fe66|
|com.controlefinanceiro.api.domain.onboarding.OnboardingReviewTemporalTest|5|0|0|0|8b115d14a0c61a20a876f07c9d00acae8b7ae23c24b9d7a943deee87588cca9c|
|com.controlefinanceiro.api.domain.onboarding.OnboardingV16MigrationTest|1|0|0|0|a1f3370b0d3f9d4a0204c92fe4da4c07889390ce5684fc804bc986a7c8e5f336|
|com.controlefinanceiro.api.domain.TemporalJsonContractTest|18|0|0|0|31b55056ac91a53f4b188a5cd9b3017c45fbddfbb430a97442d3140bb9df4be3|
|com.controlefinanceiro.api.domain.validation.FutureInProductZoneValidatorTest|2|0|0|0|44824e43bb1b67df2e65ce1aa4acb3fb18c143f4e352c95e08802f98f86a5613|
|com.controlefinanceiro.api.FrontendClosureBrowserTest|1|0|0|0|79ec57a953f1240e7514915ba7925eb2d6d91834a155bf48f40233506203d58e|
|com.controlefinanceiro.api.GoalHistoryRecordedInstantIntegrationTest|4|0|0|0|37ad1a90a7f4be6bdc63be024f3af587f65b0809febca3f543351f192661a63a|
|com.controlefinanceiro.api.HarnessCredentialClockTest|1|0|0|0|75e126cffb550dc94df22ac33cc4afa760813828a23b96593cbcd77b61bb0cf1|
|com.controlefinanceiro.api.infra.operations.EmailMaintenanceTest|1|0|0|0|2f0806d5cde46209788d2c241f4e651e3dddb09713713379403c4e746eee3905|
|com.controlefinanceiro.api.infra.operations.HealthControllerTest|1|0|0|0|e4e4fd533f62985e5d3cac278315ca464f4617561a7b3e9ef59f772ad2e7ea91|
|com.controlefinanceiro.api.infra.security.UserIsolationBrowserIntegrationTest|1|0|0|0|afb55ecee498bb16190194ae44f39a0349f2a37a92772b31ed58e6ea7b46af3e|
|com.controlefinanceiro.api.infra.security.UserIsolationIntegrationTest|80|0|0|0|a90656ab784b849fd7d440eb008034122cd3e386760aa696dbdeb26acb1b5a63|
|com.controlefinanceiro.api.IntegratedMilestoneBrowserReviewTest|1|0|0|0|4f2d34834ab7aebb9f32e39a30f79e293ce9599872d678d232b1b19748ad914a|
|com.controlefinanceiro.api.migration.AdoptionNativeSocketsTest|1|0|0|0|5410f1f613664b456bbb9f400f6bb1916770856929bbec28406b452a0f6b1ceb|
|com.controlefinanceiro.api.migration.AdoptionPortAllocationTest|1|0|0|0|df73daedcac084cf8342b6f3871e9a627f6f7acba0f3f5b9a7d4b8dcb13d8990|
|com.controlefinanceiro.api.migration.AdoptionRuntimeTest|17|0|0|0|44042ae762b1bba1682b9034feee19b319e582cf71309a93ce6a36af6e65ef22|
|com.controlefinanceiro.api.migration.Cf017ManifestTest|1|0|0|0|3f9ba75fa296adcde8b0c2c6a7820e9d8d3e59f40907bd897b9d9caf3aa65fc0|
|com.controlefinanceiro.api.migration.Cf017OriginalFindingsTest|3|0|0|0|67f8b3baf0fc7736ca4206918d3a0428c74713a213b6c34642d3cb74d352c7b3|
|com.controlefinanceiro.api.migration.Cf017PreflightTest|28|0|0|0|097885a763147f1fe06f9d18745ab6104b53a3c988133139698fa9498f45871e|
|com.controlefinanceiro.api.migration.Cf017RestoreTest|21|0|0|0|3958dd70c2fc12ed0bbf6dad3f5882f121aee9758bce1ec9523a3c6a23238af8|
|com.controlefinanceiro.api.migration.EmptyDatabaseMigrationIntegrationTest|6|0|0|0|746c61befc3d7eb617f1e21cc42272079738f49a00109a31d65045ec17732ab7|
|com.controlefinanceiro.api.migration.GoalHistoryUpgradeTest|1|0|0|0|5b2f21670baf2b1c97d86ab94717a3ca74dd699667466cba4b14c70b6b0231a2|
|com.controlefinanceiro.api.migration.IncrementalMilestoneReviewTest|10|0|0|0|0841a31afd7fd16e4bae044fcf65e5165b9253af43dc2795d0107237aa42c045|
|com.controlefinanceiro.api.migration.LegacyDatabaseMigrationIntegrationTest|2|0|0|0|668abb3a318865ef543012b479d94bfab2d53b1ce6efe3f89e4536981186bb95|
|com.controlefinanceiro.api.migration.SchedulingBoundaryTest|1|0|0|0|2b85f5063a684a21ad45d405e60e1c6dbdb049d47c47cc824c4b84131326f982|
|com.controlefinanceiro.api.MilestoneRemediationBrowserTest|1|0|0|0|f1ffd452e6659f364f2cc2ff3781867bdac333686461f98d8c0eec419bd0602a|
|com.controlefinanceiro.api.PlanningEditIntegrationTest|5|0|0|0|8613f0f642ae299bb2fa772e8b67762889de28b73935090befa270e590314390|
|com.controlefinanceiro.api.PostgreSqlPersistenceTests|2|0|0|0|e751468c1fd4b5f5f6e723155dd978477e68ef8e90e32ceb9cac826a21d0483c|
|com.controlefinanceiro.api.PostgreSqlTemporalRoundTripTests|3|0|0|0|5fd4fa172dacae64fa2169af4dd4b72941d745e8e99aeca49a93a0f0b9a38998|
|com.controlefinanceiro.api.Rf15IndependentBrowserTest|1|0|0|0|123b1e09e3840c6e21965e962cf4c9b7c476a4a5d4c9ed8977953b023b84a4bc|
|com.controlefinanceiro.api.Rf15RemediationBrowserTest|1|0|0|0|886f6ceb86438c9b4b18c7decc53f1f07e8c06b87963f31cf904dcad04639314|
|com.controlefinanceiro.api.Rf15ResidualBrowserTest|1|0|0|0|1e7fc2a9bde184360f48c7c213bb693fa7f5e0d64d0d729c73bb0708648482d2|
|com.controlefinanceiro.api.Rf15ResidualIndependentBrowserTest|1|0|0|0|386ead02df61f049f01226db86667e1fd8ca13492b123696f41481fa265e3301|
|com.controlefinanceiro.api.Rv24CreationBrowserIntegrationTest|1|0|0|0|d63af4a1860f2aa0f1190a0b58f5cab72b3e2173af11487ec4e5a79f3d875a20|
|com.controlefinanceiro.api.Rvr24ReviewBrowserTest|1|0|0|0|6b00bb072b790c9b808ae17e38e1a23ffb0bcc48e50bf56afb72280453385f51|
|com.controlefinanceiro.api.Rvr24VisualBrowserTest|1|0|0|0|e65fc7208ca656f3aadaee4cc0ae3271af92e7c6e147ff7ca4cd104d883ed593|
|com.controlefinanceiro.api.SecurityHttpContractIntegrationTest|1|0|0|0|63005cf48345f182e6832a04b7b75f1e73e67c23c2cebac67dddbec220335c78|
|com.controlefinanceiro.api.service.Cf018RegressionIntegrationTest|24|0|0|0|6fd8375bd5b6f995d6db3283a4f2bf966c27a00c4ac80c7d2c12057d5d10653d|
|com.controlefinanceiro.api.service.Cf019CardIntegrationTest|15|0|0|0|5d24b303f5b3669410bef39e6c1f2e40ea9af6df8397b4844cae66d81afeb2ab|
|com.controlefinanceiro.api.service.Cf020GoalAllocationTest|1|0|0|0|187de60e49184eee3cfb00425029539bfdfd36a7366f0d634e36f3963f8d8b5a|
|com.controlefinanceiro.api.service.Cf020InvestmentGoalIntegrationTest|11|0|0|0|261e4f6cdea8a3a22e8d77c82f73555f845abfb6aa52b2d113340673a61cb59e|
|com.controlefinanceiro.api.service.Cf021ReportingIntegrationTest|8|0|0|0|60d4dc45e69d234e4493b1c14aee6e5e7bd6adc428bc5b158d9506735f758f98|
|com.controlefinanceiro.api.service.Cf024ConcurrencyCacheIntegrationTest|30|0|0|0|a9570bb76280844cc2b26b629851f365c664304ed34e51c92e9daa2d5cd59fe2|
|com.controlefinanceiro.api.service.Cf025QueryPerformanceIntegrationTest|7|0|0|0|afa6c6892099c4baa406488cb1027f5c7e38b820adffb044d40d6b2f24f5a6e1|
|com.controlefinanceiro.api.service.CredentialExpiryClockTest|2|0|0|0|93f38b8c2efe61ca6d92cbfee690aee1f5b671e36ce996d957b655deb25e2d61|
|com.controlefinanceiro.api.service.HabitServiceTemporalTest|1|0|0|0|565431ae40e809584e101ea837a3c303150aa0f232eac37eb5de5bb7bbf1ec5e|
|com.controlefinanceiro.api.service.IndependentRemediationBoundaryTest|2|0|0|0|33915aed93e47411fac0f431037220be997a1c282f0ddfe66df2c842b3f7adcd|
|com.controlefinanceiro.api.service.IntegratedMilestoneReviewTest|22|0|0|0|ff4e027c46f7ba71bb720325e44e843f789841cca2d5c7bf9566f140b41233aa|
|com.controlefinanceiro.api.service.intent.FinancialIntentArchitectureTest|2|0|0|0|05d597ff33d920fd33892ca860e7c29672b1f8810e8028fcf4292464df784119|
|com.controlefinanceiro.api.service.intent.FinancialIntentsIntegrationTest|5|0|0|0|bfbb20ee17600ea060440643082a9f4cd2d36ecf8e6956ecfdafe8758aaed0bc|
|com.controlefinanceiro.api.service.intent.IntentFingerprintTest|4|0|0|0|4b806630e9c72c1d5086ba270d31435530681faa120afab80dd3e6f1a3af5dac|
|com.controlefinanceiro.api.service.InvestmentServiceTemporalTest|1|0|0|0|cc85281212b47634a1611845d6bae5a3a7b3424bca8214a669830607bf65898c|
|com.controlefinanceiro.api.service.InvoiceBankOperationListenerTemporalTest|1|0|0|0|bef816a6b286a6146df2c82f95fdd9f31479b413a118ef2494633cbe804d78bf|
|com.controlefinanceiro.api.service.MilestoneCashPresentationTest|2|0|0|0|9c29548bdbe4feae8677d5dbcc2bb724ff73e0bcae8eea4f1c490fb2b58848fe|
|com.controlefinanceiro.api.service.MilestoneExportSnapshotTest|1|0|0|0|cfc77de17b9b70908022d48803827f54817ca567ba812ea371a77d4358d30c99|
|com.controlefinanceiro.api.service.MilestoneGoalFlowTest|2|0|0|0|654cb9ae618dd2471aa17080958b182b1ad8a0fda2c9a1b81235060f00334a29|
|com.controlefinanceiro.api.service.MilestoneInvestmentCorrectionTest|4|0|0|0|5dfe88784f1642babd4a21bceac7b28aa5ac0fdc80cf0ef866dfc84b5a882d63|
|com.controlefinanceiro.api.service.MilestoneReportingCoverageTest|5|0|0|0|f504205dce668a9bd540a0fdd1e0b89cb3065ac72d738d51b42bfcd6d94f754c|
|com.controlefinanceiro.api.service.MilestoneReportingPositionTest|4|0|0|0|5cdd0a75eefe5abb5dca6ebfaff93ffd9eaa52cf8828a6225a1f267c2f908dab|
|com.controlefinanceiro.api.service.MilestoneSourceConcurrencyTest|1|0|0|0|8d3db057027bb226cbc9483fa4b9edaa3783a3e632a82c75087d2e8e2a48df7d|
|com.controlefinanceiro.api.service.MilestoneTransactionCommandTest|5|0|0|0|d9529a290764d943813f1132512d538e3f9f01b60451fc51795924cfabfa9d5e|
|com.controlefinanceiro.api.service.MilestoneValuationTest|4|0|0|0|09ed092f064ae53281fa4fe801a51b33a014311b4589e094c46616591d1f9236|
|com.controlefinanceiro.api.service.MilestoneWriterPolicyTest|4|0|0|0|3d66f51f472762defb9d040e6031a83187ef42214f960d5b332285aace02009d|
|com.controlefinanceiro.api.service.ResidualInvestmentRegressionTest|8|0|0|0|549ddf0a31be856b67fca037960dc6e0c77662d0cf1e00e00fbddc64d56e740e|
|com.controlefinanceiro.api.service.Rf15InvoiceDatesTest|5|0|0|0|a52a611aa591b9f0a3d4e3ff5052486a201c35cca07e6ce7ffd52935425b2212|
|com.controlefinanceiro.api.service.Rv24DeletionIntegrationTest|36|0|0|0|4ee4dedbffa8704acb0d1745634a2ac430f13bc6e3d658ef372750c09c81d715|
|com.controlefinanceiro.api.service.ScheduledCalendarClockTest|5|0|0|0|60bed1aabc66fd53deaa10a701be9f164dcec80d3a6dd2e57c44c615584764de|
|com.controlefinanceiro.api.service.TransactionServiceTemporalTest|1|0|0|0|3ea820c305c2c25ec7faf16114691679d16e3701a017fb27e3b551f099a4c46a|
|com.controlefinanceiro.api.support.DisposablePostgresGuardTest|4|0|0|0|c5bd0c85571122452912482575500f69cedec258f8f014c62440ed59eb3cbaa0|
|com.controlefinanceiro.api.TemporalCompatibilityIntegrationTest|9|0|0|0|ee84acbb0a6f02eddc0dcd1d9f792171fb109c8abc25ff247ea71a27c50c6e45|
|com.controlefinanceiro.api.utils.DateUtilTest|3|0|0|0|10146a3bda5cb02b5a7ddce34fcabaab5094d9855ca8950c9fe5c7faafebbbc7|
|com.controlefinanceiro.api.utils.TemporalConfigTest|1|0|0|0|e7cba09da4bf3858f052e8f69bbcd7997c89e8199104676cae745536f31c74d6|
