#!/usr/bin/env node
//----------------------------------------------------------------------------//
//              uploads a smoke test for voltcloud-for-browsers               //
//----------------------------------------------------------------------------//

  import {
    actOnBehalfOfDeveloper, focusOnApplicationCalled, uploadToApplication
  } from 'voltcloud-for-nodejs'

  import path from 'path'
  import  fs  from 'fs'

/**** fetch required environment variables ****/

  const DeveloperAddress = process.env.developer_email_address
  if (DeveloperAddress == null) {
    console.error(
      'please, set environment variable "developer_email_address" to the ' +
      'email address of a VoltCloud application developer'
    )
    process.exit(1)
  }

  const DeveloperPassword = process.env.developer_password
  if (DeveloperPassword == null) {
    console.error(
      'please, set environment variable "developer_password" to the ' +
      'password of a VoltCloud application developer'
    )
    process.exit(2)
  }

  const ApplicationName = process.env.application_name
  if (ApplicationName == null) {
    console.error(
      'please, set environment variable "application_name" to the ' +
      'VoltCloud name of this smoke test'
    )
    process.exit(3)
  }

/**** validate archive presence ****/

  let Archive
  try {
    let FilePath = path.join(process.cwd(),'smoke-test-archive-for-upload.zip')
    Archive = fs.readFileSync(FilePath)
  } catch (Signal) {
    console.error('could not load file "smoke-test-archive-for-upload.zip"',Signal)
    process.exit(4)
  }

/**** upload archive ****/

  await actOnBehalfOfDeveloper(DeveloperAddress,DeveloperPassword)
  await focusOnApplicationCalled(ApplicationName)
  await uploadToApplication(Archive)

