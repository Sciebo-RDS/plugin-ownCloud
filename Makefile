sign:
	./occ integrity:sign-app \
	--privateKey=${HOME}/.ssl/rdsOwncloud/rds.key \
	--certificate=${HOME}/.ssl/rdsOwncloud/rds.crt \
	--path="${PWD}/apps/rds"
	./occ integrity:check-app rds

pack:
	tar cfvz rds.tar.gz rds/*